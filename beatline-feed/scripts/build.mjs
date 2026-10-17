// Beatline feed builder.
// Reads config/teams.json, pulls every source, and writes static JSON to public/.
// Runs on a schedule in GitHub Actions (see .github/workflows/build.yml).
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  parseFeed, splitGoogleTitle, googleNewsUrl, sitesQuery, isRelevant, tagPlayers, sportFilter, fitsSport, namesSport,
  dedupe, fallbackSummary, toTimestamp, readEspnTeam, readEspnRoster, parseSidearmRoster, hashId,
  readStandings, readSchedule, raceFromSchedules, parseXenForoThreads, readPolls,
  pickPodcastResult, channelIdFromHtml, mergeRecipe, isDue, previewFromHtml,
  googleArticleId, googleSignature, googleBatchBody, parseGoogleBatch,
} from './lib.mjs';
import { generateAll, GENERATED } from './generate.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public');
const CACHE = path.join(ROOT, 'cache');
const UA = 'Mozilla/5.0 (compatible; BeatlineFeed/1.0; +https://github.com/)';

export async function getText(url, { fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(url, opts) {
  return JSON.parse(await getText(url, opts));
}

async function pool(tasks, limit = 6) {
  const results = new Array(tasks.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, async () => {
      while (i < tasks.length) {
        const idx = i++;
        results[idx] = await tasks[idx]();
      }
    }),
  );
  return results;
}

async function readJsonFile(p, fallback) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}

// ---------- sources ----------

async function newsSource(team, query, ctx) {
  const xml = await getText(googleNewsUrl(query, { lang: team.lang || 'en', region: team.region || 'US' }), ctx);
  return parseFeed(xml).items.map((it) => ({
    kind: 'news',
    source: it.sourceName || 'News',
    sourceUrl: it.sourceUrl,
    title: splitGoogleTitle(it.title, it.sourceName),
    url: it.link,
    at: toTimestamp(it.date),
    description: '',
    teamOnly: false,
  }));
}

async function resolvePodcastFeed(p, ctx, cache) {
  if (p.feedUrl) return p.feedUrl;
  const key = p.appleId ? `apple:${p.appleId}` : `search:${p.search}`;
  if (cache[key]) return cache[key];
  let feedUrl;
  if (p.feedUrl) feedUrl = p.feedUrl;
  else if (p.appleId) {
    const j = await getJson(`https://itunes.apple.com/lookup?id=${p.appleId}&entity=podcast`, ctx);
    feedUrl = j.results?.[0]?.feedUrl;
  } else if (p.search) {
    const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(p.search)}&entity=podcast&limit=10`, ctx);
    feedUrl = pickPodcastResult(j.results || [], p.name)?.feedUrl;
  }
  if (!feedUrl) throw new Error('podcast feed not found');
  cache[key] = feedUrl;
  return feedUrl;
}

// Automatic podcast discovery: search Apple Podcasts for the team and keep shows
// whose name contains the team's location or nickname.
async function discoverPodcasts(p, ctx, cache) {
  const key = `discover:${p.discover}`;
  const hit = cache[key];
  if (hit && Date.now() - hit.at < 7 * 864e5) return hit.shows;
  const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(p.discover + ' podcast')}&entity=podcast&limit=25`, ctx);
  const kw = (p.keywords || []).map((k) => k.toLowerCase());
  const shows = (j.results || [])
    .filter((r) => r.feedUrl && kw.some((k) => (r.collectionName || '').toLowerCase().includes(k)))
    .filter((r) => /sport/i.test((r.genres || []).join(' ') + ' ' + (r.primaryGenreName || '')) || !r.primaryGenreName)
    .slice(0, p.limit || 3)
    .map((r) => ({ name: r.collectionName, feedUrl: r.feedUrl }));
  cache[key] = { at: Date.now(), shows };
  return shows;
}

async function podcastSource(team, p, ctx, cache) {
  if (p.discover) {
    const shows = await discoverPodcasts(p, ctx, cache.podcasts);
    const lists = await Promise.all(shows.map((show) => podcastSource(team, { ...show, teamOnly: false }, ctx, cache).catch(() => [])));
    return lists.flat();
  }
  const feedUrl = await resolvePodcastFeed(p, ctx, cache.podcasts);
  const feed = parseFeed(await getText(feedUrl, ctx));
  return feed.items.slice(0, 15).map((it) => ({
    kind: p.radio ? 'radio' : 'pod',
    source: p.name || feed.title,
    show: p.name || feed.title,
    title: it.title,
    url: it.link || it.audio || feedUrl,
    audio: it.audio,
    image: it.image || feed.image,
    duration: it.duration,
    at: toTimestamp(it.date),
    description: it.description,
    teamOnly: p.teamOnly !== false,
    feedUrl,
  }));
}

async function resolveChannel(y, ctx, cache) {
  if (y.channelId) return y.channelId;
  if (cache[y.handle]) return cache[y.handle];
  const html = await getText(`https://www.youtube.com/${y.handle}`, ctx);
  const id = channelIdFromHtml(html);
  if (!id) throw new Error(`could not resolve ${y.handle}`);
  cache[y.handle] = id;
  return id;
}

function decodeEntities(s) {
  return String(s || '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// YouTube blocks its public channel feeds from cloud servers like GitHub's, so with a
// key we read each channel's uploads through the official API (1 quota unit per channel).
async function youtubeApiChannelId(y, key, ctx, cache) {
  if (y.channelId) return y.channelId;
  const memoKey = `api:${y.handle}`;
  if (cache[memoKey]) return cache[memoKey];
  const handle = y.handle.startsWith('@') ? y.handle : `@${y.handle}`;
  const j = await getJson(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${key}`, ctx);
  const id = j.items?.[0]?.id;
  if (!id) throw new Error(`no channel for ${handle}`);
  cache[memoKey] = id;
  return id;
}

const inflightUploads = new Map();

async function youtubeApiSource(y, key, ctx, cache) {
  const id = await youtubeApiChannelId(y, key, ctx, cache.channels);
  // Channels shared by several teams (KSL, ESPN, Big 12…) are fetched once and reused.
  // `every` (minutes) lets busy national channels refresh less often to save quota.
  const memo = (cache.ytuploads ||= {});
  const ttl = ((y.every || 20) - 2) * 60000;
  let j = memo[id] && Date.now() - memo[id].at < ttl ? memo[id].data : null;
  if (!j) {
    if (!inflightUploads.has(id)) {
      inflightUploads.set(id, (async () => {
        const uploads = 'UU' + id.slice(2);
        const raw = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=${uploads}&key=${key}`, ctx);
        const data = { items: (raw.items || []).map((v) => ({ snippet: { title: v.snippet?.title, channelTitle: v.snippet?.channelTitle, description: (v.snippet?.description || '').slice(0, 600), publishedAt: v.snippet?.publishedAt, thumbnails: v.snippet?.thumbnails?.high ? { high: { url: v.snippet.thumbnails.high.url } } : undefined, resourceId: v.snippet?.resourceId }, contentDetails: v.contentDetails })) };
        memo[id] = { at: Date.now(), data };
        return data;
      })().finally(() => inflightUploads.delete(id)));
    }
    j = await inflightUploads.get(id);
  }
  return (j.items || [])
    .filter((v) => v.snippet && !/^(Private|Deleted) video$/.test(v.snippet.title))
    .map((v) => {
      const vid = v.contentDetails?.videoId || v.snippet.resourceId?.videoId;
      const th = v.snippet.thumbnails || {};
      return {
        kind: 'video',
        source: y.name || v.snippet.channelTitle,
        title: decodeEntities(v.snippet.title),
        url: `https://www.youtube.com/watch?v=${vid}`,
        image: (th.high || th.medium || th.default)?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        at: toTimestamp(v.contentDetails?.videoPublishedAt || v.snippet.publishedAt),
        description: (v.snippet.description || '').slice(0, 600),
        teamOnly: !!y.teamOnly,
      };
    });
}

async function youtubeSource(team, y, ctx, cache) {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) return youtubeApiSource(y, key, ctx, cache);
  const id = await resolveChannel(y, ctx, cache.channels);
  const feed = parseFeed(await getText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, ctx));
  return feed.items.map((it) => ({
    kind: 'video',
    source: y.name || feed.title,
    title: it.title,
    url: it.link,
    image: it.image || (it.videoId ? `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg` : undefined),
    at: toTimestamp(it.date),
    description: it.description,
    teamOnly: !!y.teamOnly,
  }));
}

async function rssSource(team, r, ctx) {
  const feed = parseFeed(await getText(r.url, ctx));
  return feed.items.map((it) => ({
    kind: r.kind || 'news',
    source: r.name || feed.title,
    title: it.title,
    url: it.link,
    image: it.image,
    at: toTimestamp(it.date),
    description: it.description,
    teamOnly: !!r.teamOnly,
  }));
}

// ---------- social posts ----------
// Each entry in a team's `social` list is one account: a player's or the team's own.
//   { player, platform: 'X' | 'Instagram' | 'Bluesky' | 'TikTok' | 'Threads', handle, profile, rss? }
// X needs X_BEARER_TOKEN (pay per post read), Instagram needs IG_ACCESS_TOKEN + IG_USER_ID
// (free, professional accounts only), Bluesky is free. Without access the app still shows
// a button to the player's profile.
const SOCIAL_CAP = { X: 80, Instagram: 60, Bluesky: 200 };   // account refreshes per run, per platform
const SOCIAL_TTL = { X: 60, Instagram: 90, Bluesky: 30 };    // minutes between refreshes of one account
const socialBudget = {};

function socialItem(s, { text, url, image, at }) {
  const who = s.player || s.name || s.handle;
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return {
    kind: 'social', source: `${who} on ${s.platform}`, title: clean.slice(0, 220) || `New post from ${who}`,
    url: url || s.profile, image, at, description: clean.slice(0, 600),
    forcePlayers: s.player ? [s.player] : [], teamOnly: true, handle: s.handle, platform: s.platform,
    by: s.player ? 'player' : 'team',
  };
}

async function fetchX(s, ctx, memo) {
  const token = process.env.X_BEARER_TOKEN;
  const auth = { fetchImpl: (u, o) => (ctx.fetchImpl)(u, { ...o, headers: { ...(o?.headers || {}), authorization: `Bearer ${token}` } }) };
  const h = s.handle.replace(/^@/, '');
  if (!memo.id) memo.id = (await getJson(`https://api.x.com/2/users/by/username/${h}`, auth)).data?.id;
  if (!memo.id) throw new Error(`no X account @${h}`);
  const since = memo.since ? `&since_id=${memo.since}` : '';
  const j = await getJson(`https://api.x.com/2/users/${memo.id}/tweets?max_results=10&exclude=retweets,replies&tweet.fields=created_at,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url${since}`, auth);
  const media = Object.fromEntries((j.includes?.media || []).map((m) => [m.media_key, m.url || m.preview_image_url]));
  const fresh = (j.data || []).map((t) => socialItem(s, { text: t.text, url: `https://x.com/${h}/status/${t.id}`, image: media[t.attachments?.media_keys?.[0]], at: toTimestamp(t.created_at) }));
  if (j.meta?.newest_id) memo.since = j.meta.newest_id;
  return fresh;
}

async function fetchInstagram(s, ctx) {
  const h = s.handle.replace(/^@/, '');
  const fields = `business_discovery.username(${h}){media.limit(8){caption,media_type,media_url,thumbnail_url,permalink,timestamp}}`;
  const j = await getJson(`https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}?fields=${encodeURIComponent(fields)}&access_token=${process.env.IG_ACCESS_TOKEN}`, ctx);
  return (j.business_discovery?.media?.data || []).map((m) => socialItem(s, { text: m.caption, url: m.permalink, image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url, at: toTimestamp(m.timestamp) }));
}

async function fetchBluesky(s, ctx) {
  const h = s.handle.replace(/^@/, '');
  const j = await getJson(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(h)}&limit=15&filter=posts_no_replies`, ctx);
  return (j.feed || []).filter((f) => !f.reason).map(({ post }) => socialItem(s, {
    text: post.record?.text, url: `https://bsky.app/profile/${h}/post/${post.uri.split('/').pop()}`,
    image: post.embed?.images?.[0]?.thumb || post.embed?.thumbnail || post.embed?.external?.thumb, at: toTimestamp(post.record?.createdAt),
  }));
}

const SOCIAL_FETCH = {
  X: { ready: () => !!process.env.X_BEARER_TOKEN, need: 'X_BEARER_TOKEN', run: fetchX },
  Instagram: { ready: () => !!(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID), need: 'IG_ACCESS_TOKEN and IG_USER_ID', run: fetchInstagram },
  Bluesky: { ready: () => true, run: fetchBluesky },
};

async function socialSource(team, s, ctx, cache) {
  if (s.rss) {
    const feed = parseFeed(await getText(s.rss, ctx));
    return feed.items.slice(0, 10).map((it) => socialItem(s, { text: it.title || it.description, url: it.link, image: it.image, at: toTimestamp(it.date) }));
  }
  const f = SOCIAL_FETCH[s.platform];
  if (!f || !s.handle) return { skipped: 'profile link only' };
  if (!f.ready()) return { skipped: `needs ${f.need}` };
  const key = `${s.platform}:${s.handle.toLowerCase()}`;
  const memo = ((cache.social ||= {})[key] ||= { posts: [] });
  const ttl = (SOCIAL_TTL[s.platform] || 60) * 60000;
  const cutoff = Date.now() - 14 * 864e5;
  if (!memo.at || Date.now() - memo.at > ttl) {
    socialBudget[s.platform] = (socialBudget[s.platform] || 0) + 1;
    if (socialBudget[s.platform] <= (SOCIAL_CAP[s.platform] || 60)) {
      const fresh = await f.run(s, ctx, memo);
      const seen = new Set(fresh.map((p) => p.url));
      memo.posts = [...fresh, ...memo.posts.filter((p) => !seen.has(p.url))].filter((p) => p.at >= cutoff).slice(0, 20);
      memo.at = Date.now();
    }
  }
  // Re-label stored posts in case the player's name or team changed.
  return memo.posts.map((p) => ({ ...p, ...socialItem(s, { text: p.description, url: p.url, image: p.image, at: p.at }) }));
}

// ---------- mentions: what everyone else is posting about the team ----------
// Searches social platforms for the team's name. Bluesky search is free but needs a login
// (BSKY_HANDLE + BSKY_APP_PASSWORD, an app password from Bluesky settings). X search costs
// money per post read, so it only runs when a team sets "mentions": { "x": true }.
// Queries default to the team's main name plus the sport; override with "mentions": { "queries": [...] }.
const MENTION_TTL = { Bluesky: 30, X: 180 };   // minutes between searches of one query
let bskySession = null;

async function bskyToken(ctx) {
  if (bskySession && Date.now() - bskySession.at < 90 * 60000) return bskySession.jwt;
  const res = await ctx.fetchImpl('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: process.env.BSKY_HANDLE, password: process.env.BSKY_APP_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Bluesky login failed (${res.status})`);
  const j = await res.json();
  bskySession = { jwt: j.accessJwt, at: Date.now() };
  return j.accessJwt;
}

function mentionItem({ platform, name, handle, text, url, image, at }) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return {
    kind: 'social', source: `${name || handle} on ${platform}`, title: clean.slice(0, 220), url, image, at,
    description: clean.slice(0, 600), teamOnly: false, handle, platform, by: 'fan',
  };
}

async function searchBluesky(q, ctx) {
  const jwt = await bskyToken(ctx);
  const j = await getJson(`https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&sort=latest&limit=40&lang=en`, {
    fetchImpl: (u, o) => ctx.fetchImpl(u, { ...o, headers: { ...(o?.headers || {}), authorization: `Bearer ${jwt}` } }),
  });
  return (j.posts || []).map((post) => mentionItem({
    platform: 'Bluesky', name: post.author?.displayName, handle: post.author?.handle, text: post.record?.text,
    url: `https://bsky.app/profile/${post.author?.handle}/post/${String(post.uri).split('/').pop()}`,
    image: post.embed?.images?.[0]?.thumb || post.embed?.thumbnail || post.embed?.external?.thumb,
    at: toTimestamp(post.record?.createdAt || post.indexedAt),
  }));
}

async function searchX(q, ctx, memo) {
  const auth = { fetchImpl: (u, o) => ctx.fetchImpl(u, { ...o, headers: { ...(o?.headers || {}), authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }) };
  const since = memo.since ? `&since_id=${memo.since}` : '';
  const query = encodeURIComponent(`${q} -is:retweet -is:reply lang:en`);
  const j = await getJson(`https://api.x.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=created_at,attachments,author_id&expansions=author_id,attachments.media_keys&user.fields=username,name&media.fields=url,preview_image_url${since}`, auth);
  const users = Object.fromEntries((j.includes?.users || []).map((u) => [u.id, u]));
  const media = Object.fromEntries((j.includes?.media || []).map((m) => [m.media_key, m.url || m.preview_image_url]));
  if (j.meta?.newest_id) memo.since = j.meta.newest_id;
  return (j.data || []).map((t) => {
    const u = users[t.author_id] || {};
    return mentionItem({ platform: 'X', name: u.name, handle: u.username, text: t.text, url: `https://x.com/${u.username || 'i'}/status/${t.id}`, image: media[t.attachments?.media_keys?.[0]], at: toTimestamp(t.created_at) });
  });
}

export function mentionQueries(team) {
  if (team.mentions?.queries?.length) return team.mentions.queries;
  const name = String(team.match?.[0] || team.name).replace(/"/g, '');
  const sport = { football: 'football', basketball: 'basketball', baseball: 'baseball', hockey: 'hockey', soccer: 'soccer' }[team.espn?.sport] || '';
  return [sport ? `"${name}" ${sport}` : `"${name}"`];
}

async function mentionSource(platform, q, ctx, cache, ownHandles) {
  const memo = ((cache.mentions ||= {})[`${platform}:${q}`] ||= { posts: [] });
  const ttl = (MENTION_TTL[platform] || 60) * 60000;
  if (!memo.at || Date.now() - memo.at > ttl) {
    const fresh = platform === 'X' ? await searchX(q, ctx, memo) : await searchBluesky(q, ctx);
    const seen = new Set(fresh.map((p) => p.url));
    const cutoff = Date.now() - 7 * 864e5;
    memo.posts = [...fresh, ...memo.posts.filter((p) => !seen.has(p.url))].filter((p) => p.at >= cutoff).slice(0, 60);
    memo.at = Date.now();
  }
  // Posts from the team's or a player's own account already show up as their posts.
  return memo.posts.filter((p) => p.title && !ownHandles.has(String(p.handle).toLowerCase()));
}

// Google News links -> the real article address, resolved once per article and cached.
async function resolveGoogleLinks(items, ctx, cache, limit = 60) {
  const gn = (cache.gnews ||= {});
  for (const it of items) { const id = googleArticleId(it.url); if (id && gn[id]) it.url = gn[id]; }
  const todo = items.filter((it) => googleArticleId(it.url) && gn[googleArticleId(it.url)] === undefined).slice(0, limit);
  if (!todo.length) return;
  const signed = [];
  await pool(todo.map((it, key) => async () => {
    const id = googleArticleId(it.url);
    try {
      const sig = googleSignature(await getText(`https://news.google.com/rss/articles/${id}?hl=en-US&gl=US&ceid=US:en`, { ...ctx, timeoutMs: 8000 }));
      if (sig) signed.push({ key, id, ...sig, it }); else gn[id] = '';
    } catch { /* try again next run */ }
  }), 6);
  for (let i = 0; i < signed.length; i += 20) {
    const chunk = signed.slice(i, i + 20);
    try {
      const res = await (ctx.fetchImpl)('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA },
        body: googleBatchBody(chunk),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const urls = parseGoogleBatch(await res.text());
      for (const c of chunk) {
        const real = urls[String(c.key)];
        gn[c.id] = real && /^https?:\/\//.test(real) ? real : '';
        if (gn[c.id]) c.it.url = gn[c.id];
      }
    } catch (e) {
      console.warn(`  Google News decode skipped: ${e.message}`);
    }
  }
}

// Link previews (picture + description), read once per article from the page's sharing tags.
async function addPreviews(items, ctx, cache, limit = 80) {
  const og = (cache.og ||= {});
  const get = (u) => (typeof og[u] === 'string' ? (og[u] ? { image: og[u] } : {}) : og[u]);
  const todo = items.filter((it) => it.kind === 'news' && !/news\.google\.com/.test(it.url) && og[it.url] === undefined).slice(0, limit);
  await pool(todo.map((it) => async () => {
    try { og[it.url] = previewFromHtml(await getText(it.url, { ...ctx, timeoutMs: 8000 }), it.url); } catch { og[it.url] = {}; }
  }), 8);
  for (const it of items) {
    const p = get(it.url);
    if (!p) continue;
    if (!it.image && p.image) it.image = p.image;
    if (!it.description && p.description) it.description = p.description;
  }
}

// ---------- broad search engines (catch sources nobody listed) ----------

async function bingNewsSource(team, query, ctx) {
  const mkt = team.region === 'US' || !team.region ? 'en-US' : `${team.lang || 'en'}-${team.region}`;
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&mkt=${mkt}&qft=sortbydate%3d%221%22`;
  const feed = parseFeed(await getText(url, ctx));
  return feed.items.map((it) => {
    let link = it.link;
    try { const u = new URL(it.link); link = u.searchParams.get('url') || it.link; } catch {}
    let source = it.sourceName;
    if (!source) { try { source = new URL(link).hostname.replace(/^www\./, ''); } catch { source = 'News'; } }
    return { kind: 'news', source, title: it.title, url: link, image: it.image, at: toTimestamp(it.date), description: it.description, teamOnly: false };
  });
}

// Any podcast episode, on any show, whose title or notes mention the team.
async function episodeSearchSource(team, term, ctx) {
  const country = (team.region || 'US').toLowerCase();
  const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=podcastEpisode&limit=50&country=${country}`, ctx);
  return (j.results || []).map((r) => ({
    kind: 'pod',
    source: r.collectionName,
    show: r.collectionName,
    title: r.trackName,
    url: r.trackViewUrl || r.collectionViewUrl,
    audio: r.episodeUrl,
    image: r.artworkUrl600 || r.artworkUrl160,
    duration: r.trackTimeMillis ? `${Math.round(r.trackTimeMillis / 60000)} min` : undefined,
    at: toTimestamp(r.releaseDate),
    description: stripText(r.description || r.shortDescription || ''),
    teamOnly: false,
  }));
}

function stripText(s) {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---------- message boards ----------
// Fan boards: thread titles link back to the board, like headlines link to articles.
//   { name, rss, url, teamOnly }      boards that publish a feed (CougarBoard)
//   { name, xenforo, url, teamOnly }  XenForo forums whose thread list is public (On3 boards)
async function boardSource(team, b, ctx) {
  if (b.rss) {
    const feed = parseFeed(await getText(b.rss, ctx));
    return feed.items.map((it) => ({
      kind: 'board', source: b.name, title: it.title, url: String(it.link).replace(/^http:/, 'https:'),
      at: toTimestamp(it.date), description: it.description.slice(0, 400), author: it.author, teamOnly: b.teamOnly !== false,
    }));
  }
  // Discourse forums (UteFans.net) publish each category's topics as JSON.
  if (b.discourse) {
    const base = String(b.discourse).replace(/\/$/, '');
    const origin = new URL(base).origin;
    const j = await getJson(`${base}/l/latest.json`, ctx);
    return (j.topic_list?.topics || []).filter((t) => !t.pinned && !t.pinned_globally && t.visible !== false).map((t) => ({
      kind: 'board', source: b.name, title: t.title, url: `${origin}/t/${t.slug}/${t.id}`,
      at: Date.parse(t.last_posted_at || t.bumped_at || t.created_at), replies: Math.max(0, (t.posts_count || 1) - 1),
      author: t.last_poster_username, teamOnly: b.teamOnly !== false, sportSure: !!b.sportSure,
    }));
  }
  // phpBB forums (USUFans.com) publish recent posts per forum; fold them into one item per thread.
  if (b.phpbb) {
    const feed = parseFeed(await getText(b.phpbb, ctx));
    const topics = new Map();
    for (const it of feed.items) {
      const link = String(it.link).replace(/&amp;/g, '&');
      const key = link.match(/[?&]t=(\d+)/)?.[1] || link;
      const title = String(it.title).replace(/^.*?(?:\u2022|â€¢)\s*/, '').replace(/^Re:\s*/i, '').trim();
      const at = toTimestamp(it.date);
      const cur = topics.get(key);
      if (!cur) {
        topics.set(key, {
          kind: 'board', source: b.name, title, url: link.replace(/&p=\d+(#p\d+)?$/, ''), at, author: it.author,
          description: String(it.description || '').replace(/Statistics: Posted by.*$/s, '').slice(0, 300),
          teamOnly: b.teamOnly !== false, sportSure: !!b.sportSure,
        });
      } else if (at > cur.at) cur.at = at;
    }
    return [...topics.values()];
  }
  if (b.xenforo) {
    const threads = parseXenForoThreads(await getText(b.xenforo, ctx), b.xenforo);
    return threads.filter((t) => t.at).map((t) => ({
      kind: 'board', source: b.name, title: t.title, url: t.url, at: t.at, author: t.author, replies: t.replies, teamOnly: b.teamOnly !== false,
    }));
  }
  return [];
}

// Reddit blocks anonymous requests from cloud servers, so with REDDIT_CLIENT_ID and
// REDDIT_CLIENT_SECRET (a free "script" app at reddit.com/prefs/apps) it reads through the API.
let redditToken = null;
async function redditAuth(ctx) {
  if (redditToken && Date.now() < redditToken.until) return redditToken.token;
  const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
  const res = await ctx.fetchImpl('https://www.reddit.com/api/v1/access_token', {
    method: 'POST', body: 'grant_type=client_credentials',
    headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'DiehardFeed/1.0' },
  });
  if (!res.ok) throw new Error(`Reddit login failed (${res.status})`);
  const j = await res.json();
  redditToken = { token: j.access_token, until: Date.now() + ((j.expires_in || 3600) - 120) * 1000 };
  return redditToken.token;
}

async function redditSource(team, r, ctx) {
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    const token = await redditAuth(ctx);
    const url = r.sub
      ? `https://oauth.reddit.com/r/${r.sub}/hot?limit=40&raw_json=1`
      : `https://oauth.reddit.com/search?q=${encodeURIComponent(r.search)}&sort=new&t=week&limit=40&raw_json=1`;
    const j = await getJson(url, { fetchImpl: (u, o) => ctx.fetchImpl(u, { ...o, headers: { ...(o?.headers || {}), authorization: `Bearer ${token}`, 'user-agent': 'DiehardFeed/1.0' } }) });
    return (j.data?.children || []).map(({ data: d }) => d).filter((d) => !d.stickied).map((d) => ({
      kind: 'board', source: `r/${d.subreddit}`, title: d.title, url: `https://www.reddit.com${d.permalink}`,
      at: (d.created_utc || 0) * 1000, description: String(d.selftext || '').slice(0, 400), author: d.author,
      replies: d.num_comments, image: /\.(jpe?g|png|gif)$/i.test(d.url || '') ? d.url : undefined, teamOnly: !!r.teamOnly || !!r.sub,
    }));
  }
  const url = r.sub
    ? `https://www.reddit.com/r/${r.sub}/new/.rss?limit=40`
    : `https://www.reddit.com/search.rss?q=${encodeURIComponent(r.search)}&sort=new&t=week`;
  const feed = parseFeed(await getText(url, ctx));
  return feed.items.map((it) => ({
    kind: 'board',
    source: r.sub ? `r/${r.sub}` : 'Reddit',
    title: it.title,
    url: it.link,
    at: toTimestamp(it.date),
    description: it.description.slice(0, 400),
    author: it.author,
    teamOnly: !!r.teamOnly || !!r.sub,
  }));
}

// Any YouTube channel. Needs a free YouTube Data API key; runs every few hours to stay in the free quota.
async function youtubeSearchSource(team, term, ctx, cache) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { skipped: 'no YOUTUBE_API_KEY' };
  const memo = (cache.ytsearch ||= {});
  const hit = memo[`${team.id}:${term}`];
  const every = (team.youtubeSearchEveryHours || 3) * 36e5;
  if (hit && Date.now() - hit.at < every) return hit.items;
  const after = new Date(Date.now() - 7 * 864e5).toISOString();
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&maxResults=25&q=${encodeURIComponent(term)}&publishedAfter=${after}&key=${key}`;
  const j = await getJson(url, ctx);
  const items = (j.items || []).map((v) => ({
    kind: 'video',
    source: v.snippet?.channelTitle || 'YouTube',
    title: decodeEntities(stripText(v.snippet?.title || '')),
    url: `https://www.youtube.com/watch?v=${v.id?.videoId}`,
    image: v.snippet?.thumbnails?.high?.url,
    at: toTimestamp(v.snippet?.publishedAt),
    description: v.snippet?.description || '',
    teamOnly: false,
  }));
  memo[`${team.id}:${term}`] = { at: Date.now(), items };
  return items;
}

// ---------- AI (optional) ----------

async function aiSummaries(items, team, apiKey, cache, fetchImpl) {
  const todo = items.filter((it) => !cache[it.id] && (it.description || it.kind === 'news')).slice(0, 40);
  if (!apiKey || !todo.length) return;
  const list = todo.map((it, i) => `${i + 1}. [${it.kind}] ${it.title}${it.description ? ` — ${it.description.slice(0, 400)}` : ''}`).join('\n');
  const prompt = `You write one-sentence summaries for a ${team.name} fan app. For each numbered item, write a factual summary of at most 22 words using only what the text says. Never invent scores, injuries or quotes. If the text only has a headline, write a plain one-line restatement. Return JSON: {"1":"...","2":"..."} and nothing else.\n\n${list}`;
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.BEATLINE_MODEL || 'claude-haiku-5-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
    const j = await res.json();
    const txt = j.content?.map((c) => c.text || '').join('') || '';
    const parsed = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    todo.forEach((it, i) => {
      if (parsed[String(i + 1)]) cache[it.id] = parsed[String(i + 1)];
    });
  } catch (e) {
    console.warn(`  AI summaries skipped for ${team.id}: ${e.message}`);
  }
}

async function aiBrief(items, team, apiKey, fetchImpl) {
  if (!apiKey) return undefined;
  const recent = items.slice(0, 30).map((it) => `- [${it.source}] ${it.title}`).join('\n');
  const prompt = `From these ${team.name} headlines from the last few days, write exactly 3 short bullet points (max 20 words each) that catch a fan up. Only state what the headlines support. Return JSON: {"bullets":["...","...","..."]}.\n\n${recent}`;
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.BEATLINE_MODEL || 'claude-haiku-5-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
    const j = await res.json();
    const txt = j.content?.map((c) => c.text || '').join('') || '';
    return JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)).bullets;
  } catch (e) {
    console.warn(`  AI brief skipped for ${team.id}: ${e.message}`);
    return undefined;
  }
}

// ---------- team build ----------

// ---------- standings and the race ----------
// Conference table from ESPN plus every conference team's remaining league games, so the app
// can show where the team stands and work out "what happens if" without any betting lines.
const SCHEDULE_TTL = 3 * 36e5;
async function buildRace(team, meta, ctx, cache) {
  const { sport, league, id } = team.espn;
  const base = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}`;
  const table = readStandings(await getJson(`https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings?group=${meta.groupId}`, ctx));
  if (!table.rows.length) return null;
  const memo = (cache.schedules ||= {});
  const schedules = {};
  await pool(table.rows.map((r) => async () => {
    const key = `${league}:${r.id}`;
    const m = memo[key];
    // Our own schedule is read fresh every build so scores show right after the final.
    if (m && r.id !== String(id) && Date.now() - m.at < SCHEDULE_TTL) { schedules[r.id] = m.games; return; }
    try {
      // Regular season by default (before tip-off ESPN otherwise returns an empty preseason list);
      // our own team also gets its postseason games (bowls, tournaments) when there are any.
      const regular = readSchedule(await getJson(`${base}/teams/${r.id}/schedule?seasontype=2`, ctx), r.id);
      const post = r.id === String(id) ? readSchedule(await getJson(`${base}/teams/${r.id}/schedule?seasontype=3`, ctx).catch(() => ({})), r.id) : [];
      const games = [...regular, ...post].sort((x, y) => x.date - y.date);
      memo[key] = { at: Date.now(), games };
      schedules[r.id] = games;
    } catch {
      if (m) schedules[r.id] = m.games;
    }
  }));
  const race = raceFromSchedules(table, schedules, id);
  return {
    schedule: (schedules[String(id)] || []).map(({ opp, ...g }) => ({ ...g, opp })),
    name: table.name, short: table.short, titleGame: sport === 'football' && /college/.test(league),
    rows: race.rows, remaining: race.remaining, watch: race.watch, updatedAt: Date.now(),
  };
}

// One fetch of the national polls per league per run, shared by every team in it.
const pollRuns = new Map();
async function leaguePolls(sport, league, ctx) {
  const key = `${sport}/${league}`;
  if (!pollRuns.has(key)) pollRuns.set(key, getJson(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/rankings`, ctx).catch(() => null));
  return pollRuns.get(key);
}

export async function buildTeam(team, { fetchImpl = fetch, cache, windowDays = 10, apiKey } = {}) {
  const ctx = { fetchImpl };
  const status = [];
  const espnBase = `https://site.api.espn.com/apis/site/v2/sports/${team.espn.sport}/${team.espn.league}/teams/${team.espn.id}`;

  let meta = {};
  let roster = [];
  try {
    meta = readEspnTeam(await getJson(espnBase, ctx));
    status.push({ source: 'ESPN team', ok: true });
  } catch (e) {
    status.push({ source: 'ESPN team', ok: false, error: e.message });
  }
  try {
    roster = readEspnRoster(await getJson(`${espnBase}/roster`, ctx));
    status.push({ source: 'ESPN roster', ok: true, count: roster.length });
  } catch (e) {
    status.push({ source: 'ESPN roster', ok: false, error: e.message });
  }
  // ESPN's roster can be thin before a season; fill in from the school's official roster page.
  if (team.officialRoster) {
    try {
      const extra = parseSidearmRoster(await getText(team.officialRoster, ctx), team.officialRoster);
      const key = (n) => String(n).toLowerCase().replace(/[^a-z]/g, '');
      const have = new Set(roster.map((p) => key(p.name)));
      const added = extra.filter((p) => !have.has(key(p.name)));
      roster = [...roster, ...added];
      status.push({ source: 'Official roster', ok: true, count: added.length });
    } catch (e) {
      status.push({ source: 'Official roster', ok: false, error: e.message });
    }
  }

  let standings = null;
  if (meta.groupId) {
    try {
      standings = await buildRace(team, meta, ctx, cache);
      status.push({ source: 'ESPN standings', ok: !!standings, count: standings?.rows.length || 0 });
    } catch (e) {
      status.push({ source: 'ESPN standings', ok: false, error: e.message });
    }
  }

  let polls = [];
  if (/college/.test(team.espn.league)) {
    const j = await leaguePolls(team.espn.sport, team.espn.league, ctx);
    polls = j ? readPolls(j, team.espn.id) : [];
    status.push({ source: 'National polls', ok: !!j, count: polls.length });
  }

  // School sites and ESPN spell some names differently ("Jr.", "III", apostrophes).
  const normName = (n) => String(n).toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
  const rosterByNorm = new Map(roster.map((p) => [normName(p.name), p.name]));
  const socials = (team.social || []).map((x) => (x.player ? { ...x, player: rosterByNorm.get(normName(x.player)) || x.player } : x));

  const jobs = [];
  const label = [];
  for (const q of team.news?.queries || []) { jobs.push(() => newsSource(team, q, ctx)); label.push(`News: ${q}`); }
  const term = (team.match?.[0] || team.name).replace(/"/g, '');
  for (const [key, name] of [['sites', 'local outlets'], ['sitesNational', 'national outlets'], ['sitesFans', 'fan sites and student papers']]) {
    if (team.news?.[key]?.length) {
      jobs.push(() => newsSource(team, sitesQuery(team.news[key], term), ctx));
      label.push(`News: ${name}`);
    }
  }
  for (const q of team.news?.bing || []) { jobs.push(() => bingNewsSource(team, q, ctx)); label.push(`Bing News: ${q}`); }
  for (const term of team.episodeSearch || []) { jobs.push(() => episodeSearchSource(team, term, ctx)); label.push(`Any podcast mentioning: ${term}`); }
  for (const b of team.boards || []) { jobs.push(() => boardSource(team, b, ctx)); label.push(`Board: ${b.name}`); }
  for (const r of team.reddit || []) { jobs.push(() => redditSource(team, r, ctx)); label.push(r.sub ? `Reddit: r/${r.sub}` : `Reddit search: ${r.search}`); }
  for (const term of team.youtubeSearch || []) {
    jobs.push(async () => { const res = await youtubeSearchSource(team, term, ctx, cache); if (res?.skipped) throw new Error(res.skipped); return res; });
    label.push(`Any YouTube channel: ${term}`);
  }
  for (const p of team.podcasts || []) { jobs.push(() => podcastSource(team, p, ctx, cache)); label.push(p.discover ? `Podcasts: auto-found for ${p.discover}` : `Podcast: ${p.name}`); }
  for (const y of team.youtube || []) { jobs.push(() => youtubeSource(team, y, ctx, cache)); label.push(`YouTube: ${y.name}`); }
  for (const r of team.rss || []) { jobs.push(() => rssSource(team, r, ctx)); label.push(`RSS: ${r.name}`); }
  for (const s of socials) {
    jobs.push(async () => { const r = await socialSource(team, s, ctx, cache); if (r?.skipped) { const e = new Error(r.skipped); e.skip = true; throw e; } return r; });
    label.push(`Social: ${s.player || s.name || s.handle} (${s.platform})`);
  }
  const ownHandles = new Set(socials.map((s) => String(s.handle || '').replace(/^@/, '').toLowerCase()));
  for (const q of mentionQueries(team)) {
    jobs.push(async () => {
      if (!(process.env.BSKY_HANDLE && process.env.BSKY_APP_PASSWORD)) { const e = new Error('needs BSKY_HANDLE and BSKY_APP_PASSWORD'); e.skip = true; throw e; }
      return mentionSource('Bluesky', q, ctx, cache, ownHandles);
    });
    label.push(`Mentions on Bluesky: ${q}`);
    if (team.mentions?.x) {
      jobs.push(async () => {
        if (!process.env.X_BEARER_TOKEN) { const e = new Error('needs X_BEARER_TOKEN'); e.skip = true; throw e; }
        return mentionSource('X', q, ctx, cache, ownHandles);
      });
      label.push(`Mentions on X: ${q}`);
    }
  }

  const results = await pool(jobs.map((job, i) => async () => {
    try {
      const items = await job();
      status.push({ source: label[i], ok: true, count: items.length });
      return items;
    } catch (e) {
      status.push(e.skip ? { source: label[i], ok: true, count: 0, note: e.message } : { source: label[i], ok: false, error: e.message });
      return [];
    }
  }));

  // The team's own YouTube channel counts as a team post when it shares a name with a team account.
  const officialNames = new Set([...socials.filter((s) => !s.player).map((s) => String(s.name).toLowerCase()), ...(team.youtube || []).filter((y) => y.official).map((y) => String(y.name).toLowerCase())]);
  const sport = sportFilter(team);
  const cutoff = Date.now() - windowDays * 864e5;
  let items = results.flat()
    .filter((it) => it.title && it.url && it.at && it.at >= cutoff && it.at <= Date.now() + 36e5)
    .filter((it) => it.teamOnly || isRelevant(`${it.title} ${it.description || ''}`, team))
    .filter((it) => it.sportSure || it.by === 'team' || it.by === 'player' || fitsSport(`${it.title} ${it.description || ''}`, sport))
    .filter((it) => !team.sportStrict || it.sportSure || it.forcePlayers?.length
      || namesSport(`${it.title} ${it.description || ''}`, sport)
      || (team.sportSources || []).some((n) => `${it.source || ''} ${it.show || ''}`.toLowerCase().includes(n.toLowerCase()))
      || tagPlayers(`${it.title} ${it.description || ''}`, roster).length > 0)
    .sort((a, b) => b.at - a.at)
    .map((it) => {
      const blob = `${it.title} ${it.description || ''}`;
      const players = [...new Set([...(it.forcePlayers || []), ...tagPlayers(blob, roster)])];
      return {
        id: hashId(it.url),
        kind: it.kind,
        source: it.source,
        show: it.show,
        title: it.title,
        url: it.url,
        audio: it.audio,
        image: it.image,
        duration: it.duration,
        at: it.at,
        platform: it.platform,
        author: it.author,
        replies: it.replies,
        by: it.by || (it.kind === 'video' && officialNames.has(String(it.source).toLowerCase()) ? 'team' : undefined),
        handle: it.by ? it.handle : undefined,
        players,
        description: it.description,
      };
    });
  items = dedupe(items).slice(0, team.maxItems || 400);
  await resolveGoogleLinks(items, ctx, cache);
  items = dedupe(items.map((it) => ({ ...it, id: hashId(it.url) })));
  await addPreviews(items, ctx, cache);

  await aiSummaries(items, team, apiKey, cache.summaries, fetchImpl);
  const brief = (await aiBrief(items, team, apiKey, fetchImpl)) ||
    items.filter((i) => i.kind === 'news').slice(0, 3).map((i) => `${i.title} (${i.source})`);

  const mentions = new Map();
  for (const it of items) for (const p of it.players) mentions.set(p, (mentions.get(p) || 0) + 1);
  const socialByPlayer = {};
  for (const s of socials) {
    if (s.player) (socialByPlayer[s.player] ||= []).push({ platform: s.platform, url: s.profile, handle: s.handle });
  }
  const players = roster
    .map((p) => ({ ...p, mentions: mentions.get(p.name) || 0, socials: socialByPlayer[p.name] || [] }))
    .sort((a, b) => b.mentions - a.mentions || (a.num ?? 999) - (b.num ?? 999));

  const out = items.map(({ description, ...rest }) => ({
    ...rest,
    summary: cache.summaries[rest.id] || fallbackSummary(rest.title, description),
  }));

  return {
    team: {
      id: team.id, short: team.short, name: team.name, city: team.city, league: team.league,
      mode: team.auto ? 'auto' : 'tuned',
      color: team.color || meta.color || '#3C5A78', altColor: meta.altColor,
      record: meta.record, standing: meta.standing, conference: meta.conference, next: meta.next,
    },
    brief,
    players,
    standings,
    polls,
    boards: [
      ...(team.boards || []).map((b) => ({ name: b.name, url: b.url || b.rss, premium: !!b.premium })),
      ...(team.boardLinks || []),
      ...(team.reddit || []).filter((r) => r.sub).map((r) => ({ name: `r/${r.sub}`, url: `https://www.reddit.com/r/${r.sub}/` })),
    ],
    items: out,
    sources: new Set(out.map((i) => i.source)).size,
    status,
  };
}

export async function loadRecipes() {
  const config = JSON.parse(await readFile(path.join(ROOT, 'config/leagues.json'), 'utf8'));
  const recipes = new Map();
  for (const league of config.autoTeams === false ? [] : config.leagues) {
    const list = await readJsonFile(path.join(GENERATED, `${league.id}.json`), []);
    for (const r of list) recipes.set(r.id, { ...r, every: r.every || league.every });
  }
  const customDir = path.join(ROOT, 'config/teams');
  for (const f of (await readdir(customDir).catch(() => [])).filter((x) => x.endsWith('.json'))) {
    const custom = JSON.parse(await readFile(path.join(customDir, f), 'utf8'));
    const leagueId = custom.league || custom.id.replace(/-\d+$/, '');
    const league = config.leagues.find((l) => l.id === leagueId);
    const merged = mergeRecipe(recipes.get(custom.id), { league: leagueId, ...custom });
    merged.every = custom.every || merged.every || league?.every || 60;
    merged.lang ||= league?.lang || 'en';
    merged.region ||= league?.region || 'US';
    recipes.set(custom.id, merged);
  }
  return { config, recipes };
}

export async function main({ fetchImpl = fetch, now = Date.now() } = {}) {
  await mkdir(path.join(OUT, 'teams'), { recursive: true });
  await mkdir(path.join(OUT, 'leagues'), { recursive: true });
  await mkdir(CACHE, { recursive: true });
  const { config: cfg0 } = await loadRecipes();
  if (cfg0.autoTeams !== false) {
    console.log('Checking league team lists…');
    await generateAll({ fetchImpl });
  }
  const { config, recipes } = await loadRecipes();
  const cachePath = path.join(CACHE, 'cache.json');
  const cache = await readJsonFile(cachePath, {});
  for (const k of ['podcasts', 'channels', 'summaries', 'lastBuilt']) cache[k] ||= {};
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const featured = new Set(config.featured || []);
  const deadline = now + (config.maxRunMinutes || 14) * 60000;
  const teamConcurrency = Number(process.env.TEAM_CONCURRENCY || 8);

  // Who is due this run: featured teams first, then whoever is most overdue. A team is also due
  // right away when the engine code or its own settings changed since its last build.
  const all = [...recipes.values()];
  const engine = hashId(await readFile(new URL(import.meta.url), 'utf8') + await readFile(new URL('./lib.mjs', import.meta.url), 'utf8'));
  const recipeHash = (t) => hashId(engine + JSON.stringify(t));
  cache.recipeHash ||= {};
  const changed = (t) => cache.recipeHash[t.id] !== recipeHash(t);
  const due = all
    .filter((t) => changed(t) || isDue(t, cache.lastBuilt[t.id], now))
    .sort((a, b) => (featured.has(b.id) - featured.has(a.id)) || ((cache.lastBuilt[a.id] || 0) - (cache.lastBuilt[b.id] || 0)));
  console.log(`${all.length} teams configured, ${due.length} due now.`);

  const runStatus = { startedAt: now, built: [], failedSources: {}, skippedForTime: 0 };
  await pool(due.map((team) => async () => {
    if (Date.now() > deadline) { runStatus.skippedForTime++; return; }
    try {
      const built = await buildTeam(team, { fetchImpl, cache, windowDays: config.windowDays, apiKey });
      const { status: teamStatus, ...payload } = built;
      payload.updatedAt = Date.now();
      await writeFile(path.join(OUT, 'teams', `${team.id}.json`), JSON.stringify(payload));
      cache.lastBuilt[team.id] = Date.now();
      cache.recipeHash[team.id] = recipeHash(team);
      runStatus.built.push(team.id);
      const bad = teamStatus.filter((s) => !s.ok);
      if (bad.length) runStatus.failedSources[team.id] = bad;
      console.log(`  ${team.name}: ${payload.items.length} items, ${payload.sources} sources${bad.length ? `, ${bad.length} failed` : ''}`);
    } catch (e) {
      runStatus.failedSources[team.id] = [{ source: 'team build', error: e.message }];
    }
  }), teamConcurrency);

  // League directories the app uses for browsing and search.
  const leagueSummaries = [];
  const keepSummaries = new Set();
  for (const league of config.leagues.concat([{ id: '_custom', name: 'Other' }])) {
    const members = all.filter((t) => (t.league || '_custom') === league.id);
    if (!members.length) continue;
    const teams = [];
    for (const t of members) {
      const built = await readJsonFile(path.join(OUT, 'teams', `${t.id}.json`), null);
      built?.items?.forEach((i) => keepSummaries.add(i.id));
      teams.push({
        id: t.id, short: t.short, name: t.name, city: t.city, league: league.id,
        color: built?.team?.color || t.color || '#3C5A78',
        mode: t.auto ? 'auto' : 'tuned',
        record: built?.team?.record, conference: built?.team?.conference, ready: !!built,
      });
    }
    teams.sort((a, b) => a.name.localeCompare(b.name));
    await writeFile(path.join(OUT, 'leagues', `${league.id}.json`), JSON.stringify({ league: { id: league.id, name: league.name, sport: league.sport }, teams }));
    leagueSummaries.push({ id: league.id, name: league.name, sport: league.sport, region: league.region, teams: teams.length, ready: teams.filter((t) => t.ready).length });
  }
  const featuredTeams = [];
  for (const id of featured) {
    const built = await readJsonFile(path.join(OUT, 'teams', `${id}.json`), null);
    if (built) featuredTeams.push({ ...built.team, ready: true });
  }
  await writeFile(path.join(OUT, 'leagues.json'), JSON.stringify({ updatedAt: Date.now(), leagues: leagueSummaries, featured: featuredTeams }));
  // Older app versions read index.json.
  await writeFile(path.join(OUT, 'index.json'), JSON.stringify({ updatedAt: Date.now(), teams: featuredTeams }));

  cache.summaries = Object.fromEntries(Object.entries(cache.summaries).filter(([k]) => keepSummaries.has(k)));
  runStatus.finishedAt = Date.now();
  runStatus.totalTeams = all.length;
  await writeFile(path.join(OUT, 'status.json'), JSON.stringify(runStatus, null, 2));
  await writeFile(cachePath, JSON.stringify(cache));
  if (!existsSync(path.join(OUT, '.nojekyll'))) await writeFile(path.join(OUT, '.nojekyll'), '');
  console.log(`Built ${runStatus.built.length} teams${runStatus.skippedForTime ? `, ${runStatus.skippedForTime} left for the next run` : ''}.`);
  return runStatus;
}

function countKinds(items) {
  const c = {};
  for (const i of items) c[i.kind] = (c[i.kind] || 0) + 1;
  return c;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

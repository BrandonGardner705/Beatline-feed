// Beatline feed builder.
// Reads config/teams.json, pulls every source, and writes static JSON to public/.
// Runs on a schedule in GitHub Actions (see .github/workflows/build.yml).
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  parseFeed, splitGoogleTitle, googleNewsUrl, sitesQuery, isRelevant, tagPlayers,
  dedupe, fallbackSummary, toTimestamp, readEspnTeam, readEspnRoster, hashId,
  pickPodcastResult, channelIdFromHtml, mergeRecipe, isDue,
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

// Social posts arrive as RSS made by a feed service (for example RSS.app or a
// self-hosted RSSHub) for each athlete account. See README "Player social posts".
async function socialSource(team, s, ctx) {
  if (!s.rss) return [];
  const feed = parseFeed(await getText(s.rss, ctx));
  return feed.items.slice(0, 10).map((it) => ({
    kind: 'social',
    source: `${s.player} on ${s.platform}`,
    title: it.title || it.description.slice(0, 140),
    url: it.link || s.profile,
    image: it.image,
    at: toTimestamp(it.date),
    description: it.description,
    forcePlayers: [s.player],
    teamOnly: true,
  }));
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

async function redditSource(team, r, ctx) {
  const url = r.sub
    ? `https://www.reddit.com/r/${r.sub}/new/.rss?limit=40`
    : `https://www.reddit.com/search.rss?q=${encodeURIComponent(r.search)}&sort=new&t=week`;
  const feed = parseFeed(await getText(url, ctx));
  return feed.items.map((it) => ({
    kind: 'social',
    source: r.sub ? `r/${r.sub}` : 'Reddit',
    title: it.title,
    url: it.link,
    at: toTimestamp(it.date),
    description: it.description.slice(0, 500),
    teamOnly: !!r.teamOnly,
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
  for (const r of team.reddit || []) { jobs.push(() => redditSource(team, r, ctx)); label.push(r.sub ? `Reddit: r/${r.sub}` : `Reddit search: ${r.search}`); }
  for (const term of team.youtubeSearch || []) {
    jobs.push(async () => { const res = await youtubeSearchSource(team, term, ctx, cache); if (res?.skipped) throw new Error(res.skipped); return res; });
    label.push(`Any YouTube channel: ${term}`);
  }
  for (const p of team.podcasts || []) { jobs.push(() => podcastSource(team, p, ctx, cache)); label.push(p.discover ? `Podcasts: auto-found for ${p.discover}` : `Podcast: ${p.name}`); }
  for (const y of team.youtube || []) { jobs.push(() => youtubeSource(team, y, ctx, cache)); label.push(`YouTube: ${y.name}`); }
  for (const r of team.rss || []) { jobs.push(() => rssSource(team, r, ctx)); label.push(`RSS: ${r.name}`); }
  for (const s of team.social || []) { jobs.push(() => socialSource(team, s, ctx)); label.push(`Social: ${s.player} (${s.platform})`); }

  const results = await pool(jobs.map((job, i) => async () => {
    try {
      const items = await job();
      status.push({ source: label[i], ok: true, count: items.length });
      return items;
    } catch (e) {
      status.push({ source: label[i], ok: false, error: e.message });
      return [];
    }
  }));

  const cutoff = Date.now() - windowDays * 864e5;
  let items = results.flat()
    .filter((it) => it.title && it.url && it.at && it.at >= cutoff && it.at <= Date.now() + 36e5)
    .filter((it) => it.teamOnly || isRelevant(`${it.title} ${it.description || ''}`, team))
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
        players,
        description: it.description,
      };
    });
  items = dedupe(items).slice(0, team.maxItems || 400);

  await aiSummaries(items, team, apiKey, cache.summaries, fetchImpl);
  const brief = (await aiBrief(items, team, apiKey, fetchImpl)) ||
    items.filter((i) => i.kind === 'news').slice(0, 3).map((i) => `${i.title} (${i.source})`);

  const mentions = new Map();
  for (const it of items) for (const p of it.players) mentions.set(p, (mentions.get(p) || 0) + 1);
  const socialByPlayer = {};
  for (const s of team.social || []) {
    (socialByPlayer[s.player] ||= []).push({ platform: s.platform, url: s.profile });
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

  // Who is due this run: featured teams first, then whoever is most overdue.
  const all = [...recipes.values()];
  const due = all
    .filter((t) => isDue(t, cache.lastBuilt[t.id], now))
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

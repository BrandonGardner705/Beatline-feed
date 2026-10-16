// Pure helpers for the Beatline feed builder. No network calls live here,
// so everything in this file is covered by the tests in /test.
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  removeNSPrefix: false,
  processEntities: true,
  htmlEntities: true,
});

const arr = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object' && '#text' in v) return String(v['#text']);
  return '';
};

export function stripHtml(s = '') {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashId(s) {
  return createHash('sha1').update(s).digest('hex').slice(0, 12);
}

export function formatDuration(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const s = String(raw).trim();
  let secs;
  if (/^\d+$/.test(s)) secs = Number(s);
  else {
    const parts = s.split(':').map(Number);
    if (parts.some(Number.isNaN)) return undefined;
    secs = parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  if (!secs) return undefined;
  if (secs < 3600 && secs % 60 && secs < 600) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }
  return `${Math.round(secs / 60)} min`;
}

// Parses RSS 2.0 and Atom (YouTube) into one shape.
export function parseFeed(xml) {
  let doc;
  try {
    doc = parser.parse(xml);
  } catch {
    return { title: '', image: undefined, items: [] };
  }
  if (doc.rss) {
    const ch = doc.rss.channel || {};
    const chImage = ch['itunes:image']?.['@href'] || text(ch.image?.url) || undefined;
    const items = arr(ch.item).map((it) => {
      const enclosure = arr(it.enclosure)[0];
      const media = arr(it['media:content'])[0] || arr(it['media:thumbnail'])[0];
      const src = it.source;
      return {
        title: stripHtml(text(it.title)),
        link: text(it.link) || text(it.guid),
        date: text(it.pubDate) || text(it['dc:date']),
        description: stripHtml(text(it['content:encoded']) || text(it.description) || text(it['itunes:summary'])),
        image: it['itunes:image']?.['@href'] || media?.['@url'] || (enclosure?.['@type']?.startsWith('image') ? enclosure['@url'] : undefined),
        audio: enclosure?.['@type']?.startsWith('audio') ? enclosure['@url'] : undefined,
        duration: formatDuration(text(it['itunes:duration'])),
        sourceName: src ? text(src) : undefined,
        sourceUrl: src?.['@url'],
        author: stripHtml(text(it.author) || text(it['dc:creator'])) || undefined,
      };
    });
    return { title: stripHtml(text(ch.title)), image: chImage, items };
  }
  if (doc.feed) {
    const f = doc.feed;
    const items = arr(f.entry).map((e) => {
      const group = e['media:group'] || {};
      const link = arr(e.link).find((l) => !l['@rel'] || l['@rel'] === 'alternate') || arr(e.link)[0];
      return {
        title: stripHtml(text(e.title)),
        link: link?.['@href'] || '',
        date: text(e.published) || text(e.updated),
        description: stripHtml(text(group['media:description']) || text(e.summary) || text(e.content)),
        image: group['media:thumbnail']?.['@url'],
        videoId: text(e['yt:videoId']) || undefined,
      };
    });
    return { title: stripHtml(text(f.title)), image: undefined, items };
  }
  return { title: '', image: undefined, items: [] };
}

// Google News titles look like "Headline here - Deseret News".
export function splitGoogleTitle(title, sourceName) {
  if (sourceName && title.endsWith(` - ${sourceName}`)) {
    return title.slice(0, -(sourceName.length + 3)).trim();
  }
  const i = title.lastIndexOf(' - ');
  return i > 20 ? title.slice(0, i).trim() : title;
}

export function googleNewsUrl(query, { lang = 'en', region = 'US' } = {}) {
  const q = encodeURIComponent(`${query} when:7d`);
  const hl = lang === 'en' ? `en-${region}` : lang;
  return `https://news.google.com/rss/search?q=${q}&hl=${hl}&gl=${region}&ceid=${region}:${lang}`;
}

export function sitesQuery(sites, term) {
  const part = sites.map((s) => `site:${s}`).join(' OR ');
  return `"${term}" (${part})`;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termRe(term) {
  // Short all-caps terms (BYU, USU) must match case and word boundaries.
  const caseSensitive = term.length <= 4 && term === term.toUpperCase();
  return new RegExp(`(^|[^A-Za-z0-9])${escapeRe(term)}(?=$|[^A-Za-z0-9])`, caseSensitive ? '' : 'i');
}

const SPORT_CONTEXT = {
  football: ['football', 'game', 'coach', 'quarterback', 'QB', 'season', 'touchdown', 'bowl', 'recruit', 'roster', 'practice', 'kickoff', 'defense', 'offense', 'win', 'loss', 'beat', 'transfer', 'depth chart', 'Big 12', 'Pac-12', 'playoff'],
  basketball: ['basketball', 'NBA', 'game', 'coach', 'season', 'preseason', 'playoff', 'roster', 'trade', 'draft', 'rookie', 'points', 'rebounds', 'win', 'loss', 'beat', 'tipoff', 'guard', 'forward', 'center'],
  baseball: ['baseball', 'MLB', 'game', 'inning', 'pitcher', 'season', 'roster', 'trade', 'win', 'loss'],
  hockey: ['hockey', 'NHL', 'game', 'goal', 'season', 'roster', 'trade', 'win', 'loss'],
  soccer: ['soccer', 'football', 'match', 'goal', 'league', 'coach', 'manager', 'transfer', 'win', 'loss', 'draw'],
};

// Full names (match) count on their own. Nicknames (matchWeak) count only when
// capitalized and next to sports words, so "smooth jazz" or Texas A&M "Aggies" stay out.
export function isRelevant(textBlob, team) {
  const t = textBlob || '';
  const strongHit = (team.match || []).some((x) => termRe(x).test(t));
  const fullNameHit = (team.match || []).slice(0, 1).some((x) => termRe(x).test(t));
  if ((team.exclude || []).some((x) => termRe(x).test(t)) && !fullNameHit) return false;
  if (strongHit) return true;
  const weak = team.matchWeak || [];
  if (!weak.length) return false;
  const weakHit = weak.some((x) => new RegExp(`(^|[^A-Za-z0-9])${escapeRe(x)}(?=$|[^A-Za-z0-9])`).test(t));
  if (!weakHit) return false;
  const context = team.context || SPORT_CONTEXT[team.espn?.sport] || [];
  return context.some((c) => termRe(c).test(t));
}

// ---------- one sport per feed ----------
// A school's football feed should not fill up with its basketball stories and the reverse.
// A story is dropped when it names another sport and never names this one.
const SPORT_WORDS = {
  football: ['football', 'gridiron', 'quarterback', 'QB', 'touchdown', 'linebacker', 'cornerback', 'receiver', 'running back', 'tight end', 'kicker', 'kickoff', 'field goal', 'bowl game', 'bowl', 'CFP', 'depth chart', 'spring game', 'fall camp', 'offensive line', 'defensive line', 'gameday', 'cfb', 'college football'],
  basketball: ['basketball', 'hoops', 'MBB', 'point guard', 'rebound', 'rebounds', 'three-pointer', '3-pointer', 'tipoff', 'tip-off', 'March Madness', 'NCAA Tournament', 'Final Four', 'Sweet 16', 'dunk', 'buzzer-beater', 'KenPom'],
  baseball: ['baseball', 'inning', 'pitcher', 'home run'],
  softball: ['softball'],
  volleyball: ['volleyball'],
  soccer: ['soccer'],
  gymnastics: ['gymnastics', 'gymnast', 'Red Rocks'],
  hockey: ['hockey'],
  other: ['track and field', 'cross country', 'swimming', 'swim and dive', 'golf', 'tennis', 'wrestling', 'lacrosse', 'skiing', 'rugby'],
};
const WOMENS = ["women's basketball", 'womens basketball', 'WBB', "women's hoops", 'Lady Aggies', 'Lady Cougars'];

export function sportFilter(team) {
  const sport = team.espn?.sport;
  if (team.sportFilter === false || !SPORT_WORDS[sport]) return null;
  const womens = /^womens-/.test(team.league || team.id || '');
  const on = [...SPORT_WORDS[sport], ...(team.onTopic || [])];
  const off = [...Object.entries(SPORT_WORDS).filter(([k]) => k !== sport).flatMap(([, v]) => v), ...(sport === 'basketball' && !womens ? WOMENS : []), ...(team.offTopic || [])];
  return { on: on.map(termRe), off: off.map(termRe) };
}

// Strict feeds (a school's second sport) keep only stories that clearly name the sport,
// its coach or one of its players; general school coverage stays with the main sport.
export function namesSport(textBlob, filter) {
  return !!filter && filter.on.some((re) => re.test(textBlob || ''));
}

export function fitsSport(textBlob, filter) {
  if (!filter) return true;
  const t = textBlob || '';
  if (!filter.off.some((re) => re.test(t))) return true;
  const rest = filter.off.reduce((acc, re) => acc.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), ' '), t);
  return filter.on.some((re) => re.test(rest));
}

export function tagPlayers(textBlob, players) {
  const found = [];
  for (const p of players) {
    if (!p.name || p.name.length < 5) continue;
    if (termRe(p.name).test(textBlob)) found.push(p.name);
  }
  return found.slice(0, 6);
}

export function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
}

// Google News links are redirects with no picture; a copy of the same story from
// Bing or the outlet's own feed links straight to the article and often has one.
const isRedirect = (u) => /news\.google\.com/.test(u || '');
const better = (a, b) => (!!b.image - !!a.image) || (isRedirect(a.url) - isRedirect(b.url));

export function dedupe(items) {
  const seenUrl = new Set();
  const byTitle = new Map();
  const out = [];
  for (const it of items) {
    if (!it.title) continue;
    const nt = normalizeTitle(it.title);
    if (seenUrl.has(it.url)) continue;
    const prev = byTitle.get(nt);
    if (prev !== undefined) {
      if (better(out[prev], it) > 0) out[prev] = { ...it, at: Math.max(out[prev].at || 0, it.at || 0) };
      continue;
    }
    seenUrl.add(it.url);
    byTitle.set(nt, out.length);
    out.push(it);
  }
  return out;
}

// Article preview picture: the image a publisher sets for link previews (og:image / twitter:image).
function metaContent(head, names) {
  for (const n of names) {
    const tags = head.match(new RegExp(`<meta[^>]+(?:property|name)=["']${n.replace(/[:]/g, '\\:')}["'][^>]*>`, 'i'));
    const c = tags && tags[0].match(/content=["']([^"']*)["']/i);
    if (c && c[1].trim()) return c[1];
  }
  return undefined;
}

const decodeHtml = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));

// The link preview a publisher sets for sharing (what Facebook, iMessage and Slack show).
export function previewFromHtml(html, base) {
  const head = String(html).slice(0, 250000);
  const out = {};
  const img = metaContent(head, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']);
  if (img) { try { out.image = new URL(decodeHtml(img), base).href; } catch {} }
  const desc = metaContent(head, ['og:description', 'twitter:description', 'description']);
  if (desc) out.description = decodeHtml(desc).replace(/\s+/g, ' ').trim().slice(0, 400);
  const site = metaContent(head, ['og:site_name']);
  if (site) out.site = decodeHtml(site).trim();
  return out;
}

export function previewImageFromHtml(html, base) {
  return previewFromHtml(html, base).image;
}

// ---------- Google News links ----------
// Google News RSS links are redirects (news.google.com/rss/articles/<id>). The real
// article address is resolved with the same two calls the Google News web page makes.
export function googleArticleId(url) {
  const m = String(url || '').match(/^https?:\/\/news\.google\.com\/(?:rss\/)?(?:articles|read)\/([^?#/]+)/);
  return m ? m[1] : null;
}

export function googleSignature(html) {
  const sg = String(html).match(/data-n-a-sg="([^"]+)"/);
  const ts = String(html).match(/data-n-a-ts="([^"]+)"/);
  return sg && ts ? { sig: sg[1], ts: ts[1] } : null;
}

const GARTURL_CTX = [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0];

export function googleBatchBody(items) {
  const env = items.map(({ key, id, ts, sig }) => ['Fbv4je', JSON.stringify(['garturlreq', GARTURL_CTX, id, /^\d+$/.test(String(ts)) ? Number(ts) : ts, sig]), null, String(key)]);
  return 'f.req=' + encodeURIComponent(JSON.stringify([env]));
}

export function parseGoogleBatch(text) {
  let body = String(text);
  if (body.includes('\n\n')) body = body.split('\n\n').slice(1).join('\n\n');
  body = body.trimStart();
  if (body.startsWith(")]}'")) body = body.slice(body.indexOf('\n') + 1).trimStart();
  const rows = JSON.parse(body);
  const out = {};
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 3 || (row[0] !== 'wrb.fr' && row[1] !== 'Fbv4je')) continue;
    let payload = row[2];
    if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { continue; } }
    if (!Array.isArray(payload) || payload[0] !== 'garturlres') continue;
    const key = [...row.slice(3)].reverse().find((c) => c != null);
    out[String(key)] = payload[1];
  }
  return out;
}

export function fallbackSummary(title, description) {
  const d = (description || '').trim();
  if (!d) return undefined;
  const nt = normalizeTitle(title);
  const nd = normalizeTitle(d);
  if (nd.startsWith(nt.slice(0, 40))) return undefined; // description just repeats the headline
  if (d.length <= 200) return d;
  const cut = d.slice(0, 200);
  const dot = cut.lastIndexOf('. ');
  return (dot > 80 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…').trim();
}

export function toTimestamp(dateStr) {
  const ms = Date.parse(dateStr);
  return Number.isNaN(ms) ? undefined : ms;
}

// Pull what the app needs out of ESPN's public team and roster JSON.
export function readEspnTeam(teamJson) {
  const t = teamJson?.team || {};
  const record = t.record?.items?.find((r) => r.type === 'total')?.summary || t.record?.items?.[0]?.summary;
  const standing = t.standingSummary || '';
  const conference = standing.includes(' in ') ? standing.split(' in ').slice(1).join(' in ') : '';
  const ev = t.nextEvent?.[0];
  let next;
  if (ev) {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];
    const us = competitors.find((c) => String(c.id) === String(t.id) || String(c.team?.id) === String(t.id));
    const them = competitors.find((c) => c !== us);
    next = {
      name: ev.shortName || ev.name,
      date: Date.parse(ev.date) || undefined,
      opponent: them?.team?.displayName || them?.team?.shortDisplayName || '',
      home: us?.homeAway === 'home',
      status: comp?.status?.type?.state || ev.status?.type?.state,
    };
  }
  return {
    espnName: t.displayName,
    color: t.color ? `#${t.color}` : undefined,
    altColor: t.alternateColor ? `#${t.alternateColor}` : undefined,
    record: record || '',
    standing,
    conference,
    groupId: t.groups?.isConference !== false ? t.groups?.id : t.groups?.parent?.id,
    next,
  };
}

// ---------- standings and the conference race ----------
// ESPN standings: one row per team with overall and conference records.
export function readStandings(json) {
  const blocks = json?.standings?.entries ? [json.standings] : (json?.children || []).map((c) => c.standings).filter(Boolean);
  const rows = [];
  for (const b of blocks) {
    for (const e of b.entries || []) {
      const stat = (type) => e.stats?.find((x) => x.type === type);
      const conf = stat('vsconf')?.summary || '0-0';
      const [cw, cl] = conf.split('-').map((n) => Number(n) || 0);
      rows.push({
        id: String(e.team?.id),
        name: e.team?.displayName || e.team?.name,
        short: e.team?.abbreviation || e.team?.shortDisplayName,
        overall: stat('total')?.summary || stat('total')?.displayValue || '',
        conf, confW: cw, confL: cl,
        streak: e.stats?.find((x) => x.name === 'streak')?.displayValue || '',
        seed: Number(e.stats?.find((x) => x.name === 'playoffSeed')?.value) || undefined,
      });
    }
  }
  rows.sort((a, b) => (a.seed || 99) - (b.seed || 99) || b.confW - a.confW || a.confL - b.confL);
  return { name: json?.name || json?.shortName || '', short: json?.abbreviation || json?.shortName || '', rows };
}

// One team's schedule as plain games, with score, TV and venue when ESPN has them.
export function readSchedule(json, teamId) {
  const score = (c) => {
    const v = c?.score;
    if (v == null) return undefined;
    const n = typeof v === 'object' ? (v.displayValue ?? v.value) : v;
    return n === '' || n == null ? undefined : String(n);
  };
  return (json?.events || []).map((e) => {
    const c = e.competitions?.[0] || {};
    const us = (c.competitors || []).find((x) => String(x.team?.id ?? x.id) === String(teamId));
    const them = (c.competitors || []).find((x) => x !== us);
    const done = !!c.status?.type?.completed;
    const b = (c.broadcasts || [])[0];
    return {
      date: Date.parse(e.date) || 0,
      opp: String(them?.team?.id ?? them?.id ?? ''),
      oppName: them?.team?.displayName || them?.team?.shortDisplayName || '',
      oppShort: them?.team?.abbreviation || '',
      oppRank: them?.curatedRank?.current && them.curatedRank.current < 99 ? them.curatedRank.current : undefined,
      home: us?.homeAway === 'home',
      neutral: !!c.neutralSite || undefined,
      done,
      win: us?.winner === true ? true : us?.winner === false && done ? false : undefined,
      us: done ? score(us) : undefined,
      them: done ? score(them) : undefined,
      tv: b?.media?.shortName || b?.names?.[0] || undefined,
      venue: c.venue?.fullName || undefined,
      city: [c.venue?.address?.city, c.venue?.address?.state].filter(Boolean).join(', ') || undefined,
      status: c.status?.type?.state,
      detail: c.status?.type?.shortDetail,
    };
  }).filter((g) => g.opp);
}

// Remaining conference games for every team, and the games between contenders.
export function raceFromSchedules(standings, schedules, ourId, now = Date.now()) {
  const ids = new Set(standings.rows.map((r) => r.id));
  const left = (id) => (schedules[id] || []).filter((g) => !g.done && ids.has(g.opp) && g.date > now - 6 * 36e5);
  const rows = standings.rows.map((r) => {
    const n = left(r.id).length;
    return { ...r, left: n, maxW: r.confW + n };
  });
  const ours = rows.find((r) => r.id === String(ourId));
  const remaining = left(String(ourId)).sort((a, b) => a.date - b.date)
    .map((g) => ({ date: g.date, opp: g.opp, oppName: g.oppName, oppShort: rows.find((r) => r.id === g.opp)?.short || g.oppShort, home: g.home }));
  // Games to watch: contenders who could still finish level with or above us, playing each other.
  const contenders = new Set(rows.filter((r) => r.id !== String(ourId) && ours && r.maxW >= ours.confW).map((r) => r.id));
  const seen = new Set();
  const watch = [];
  for (const id of contenders) {
    for (const g of left(id)) {
      if (!contenders.has(g.opp) || g.opp === String(ourId)) continue;
      const key = [id, g.opp].sort().join('-') + g.date;
      if (seen.has(key)) continue;
      seen.add(key);
      const home = g.home ? id : g.opp; const away = g.home ? g.opp : id;
      watch.push({ date: g.date, home: rows.find((r) => r.id === home)?.short, away: rows.find((r) => r.id === away)?.short });
    }
  }
  watch.sort((a, b) => a.date - b.date);
  return { rows, remaining, watch: watch.slice(0, 8) };
}

// ---------- message boards ----------
// Thread list from a XenForo forum page (On3 and many fan boards run on it): title, link,
// replies and last activity. Pinned threads are skipped; they are old house-keeping posts.
export function parseXenForoThreads(html, base) {
  const out = [];
  for (const block of String(html || '').split(/class="structItem structItem--thread/).slice(1)) {
    if (/structItem-status--sticky/.test(block.slice(0, 2500))) continue;
    const m = block.match(/<div class="structItem-title"[^>]*>[\s\S]*?<a href="([^"]*\/threads\/[^"]*)"[^>]*>([^<]+)<\/a>/);
    if (!m) continue;
    const replies = block.match(/<dt>Replies<\/dt>\s*<dd>([^<]+)<\/dd>/)?.[1]?.trim();
    const ts = block.match(/structItem-latestDate[^>]*data-timestamp="(\d+)"/)?.[1]
      || block.match(/structItem-latestDate[^>]*data-time="(\d+)"/)?.[1];
    const dt = block.match(/structItem-latestDate[^>]*datetime="([^"]+)"/)?.[1];
    const author = block.match(/data-author="([^"]*)"/)?.[1];
    out.push({
      title: decodeHtml(m[2].trim()),
      url: new URL(m[1].replace(/\/(latest|unread)$/, '/'), base).href,
      replies: replies ? parseCount(replies) : undefined,
      at: ts ? Number(ts) * 1000 : Date.parse(dt) || undefined,
      author: author ? decodeHtml(author) : undefined,
    });
  }
  return out;
}

function parseCount(v) {
  const m = String(v).replace(/,/g, '').match(/([\d.]+)\s*([KkMm]?)/);
  if (!m) return undefined;
  return Math.round(Number(m[1]) * (/k/i.test(m[2]) ? 1e3 : /m/i.test(m[2]) ? 1e6 : 1));
}

// ---------- polls (AP Top 25, Coaches, College Football Playoff) ----------
export function readPolls(json, ourId) {
  const wanted = (r) => /AP|Coaches|Playoff|CFP/i.test(`${r.name} ${r.shortName} ${r.type}`) && !/FCS|Div(ision)?\.? ?(I{2,3}|2|3)\b|NAIA|Women/i.test(`${r.name} ${r.shortName}`);
  return (json?.rankings || []).filter(wanted).map((r) => {
    const row = (x) => ({
      rank: x.current, prev: x.previous || undefined, id: String(x.team?.id ?? ''),
      name: [x.team?.location, x.team?.name || x.team?.nickname].filter(Boolean).join(' ') || x.team?.displayName,
      short: x.team?.abbreviation, record: x.recordSummary || undefined, points: x.points || undefined, firstPlace: x.firstPlaceVotes || undefined,
    });
    const ranks = (r.ranks || []).map(row).sort((a, b) => a.rank - b.rank).slice(0, 25);
    const votes = (r.others || []).map(row).filter((x) => x.points);
    const ours = ranks.find((x) => x.id === String(ourId)) || null;
    const receiving = !ours ? votes.find((x) => x.id === String(ourId)) || null : null;
    return {
      name: r.name, short: r.shortName || r.name, date: r.date || r.lastUpdated,
      ranks, ours: ours ? { rank: ours.rank, prev: ours.prev } : null, receivingVotes: receiving ? receiving.points : null,
    };
  }).filter((p) => p.ranks.length);
}

export function readEspnRoster(rosterJson) {
  const groups = rosterJson?.athletes || [];
  const list = [];
  for (const g of groups) {
    const athletes = Array.isArray(g.items) ? g.items : [g];
    for (const a of athletes) {
      if (!a?.fullName && !a?.displayName) continue;
      const town = [a.birthPlace?.city, a.birthPlace?.state || a.birthPlace?.country].filter(Boolean).join(', ');
      list.push({
        name: a.fullName || a.displayName,
        pos: a.position?.abbreviation || '',
        position: a.position?.displayName || undefined,
        num: a.jersey ? Number(a.jersey) : undefined,
        photo: a.headshot?.href || undefined,
        height: a.displayHeight || undefined,
        weight: a.displayWeight || undefined,
        year: a.experience?.displayValue || a.experience?.abbreviation || undefined,
        hometown: town || undefined,
        espnId: a.id || undefined,
      });
    }
  }
  return list;
}

export function pickPodcastResult(results, name) {
  const want = name.toLowerCase();
  const exact = results.find((r) => (r.collectionName || '').toLowerCase() === want);
  if (exact) return exact;
  const words = want.split(/\s+/).filter((w) => w.length > 2);
  return results.find((r) => {
    const n = (r.collectionName || '').toLowerCase();
    return words.every((w) => n.includes(w));
  });
}

export function channelIdFromHtml(html) {
  const m =
    html.match(/"channelId":"(UC[\w-]{22})"/) ||
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
    html.match(/channel\/(UC[\w-]{22})/);
  return m ? m[1] : undefined;
}

// Automatic starting recipe for one team from ESPN's league team list.
export function recipeFromEspn(espnTeam, league, allTeams) {
  const t = espnTeam;
  const location = t.location || t.shortDisplayName || t.displayName;
  const nickname = t.name || '';
  const display = t.displayName || `${location} ${nickname}`.trim();
  const college = !!league.suffix;
  const sportWord = { football: league.league === 'nfl' || college ? 'football' : 'football', basketball: 'basketball', baseball: 'baseball', hockey: 'hockey', soccer: league.lang === 'es' ? 'fútbol' : '' }[league.sport] ?? '';
  const match = [display];
  if (college && location.length >= 4) match.push(location);
  const matchWeak = nickname && !/^(United|City|FC|Club)$/i.test(nickname) && nickname !== display ? [nickname] : [];
  // Teams whose name contains ours (Utah vs Utah State) are excluded automatically.
  const exclude = allTeams
    .filter((o) => o.id !== t.id)
    .map((o) => o.location || o.displayName)
    .filter((loc) => loc && loc !== location && new RegExp(`\\b${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(loc));
  const queries = [`"${display}"`];
  if (college) queries.push(`"${location}" ${sportWord}`.trim());
  return {
    id: `${league.id}-${t.id}`,
    league: league.id,
    short: (t.abbreviation || location.slice(0, 4)).toUpperCase(),
    name: college ? `${location} ${league.suffix}` : display,
    city: location,
    color: t.color ? `#${t.color}` : undefined,
    espn: { sport: league.sport, league: league.league, id: Number(t.id) },
    lang: league.lang || 'en',
    region: league.region || 'US',
    match: [...new Set(match)],
    matchWeak,
    exclude: [...new Set(exclude)],
    news: { queries, bing: [display] },
    episodeSearch: [display],
    podcasts: [{ discover: display, keywords: [location, nickname].filter((w) => w && w.length > 2), limit: 3 }],
    youtube: [],
    rss: [],
    social: [],
    auto: true,
  };
}

// Custom recipes win. Lists of sources are added together; matching rules are replaced.
export function mergeRecipe(base, custom) {
  if (!base) return { ...custom, auto: false };
  if (!custom) return base;
  const out = { ...base, ...custom, auto: false };
  for (const k of ['podcasts', 'youtube', 'rss', 'social']) {
    out[k] = [...(custom[k] || []), ...(custom.replace?.includes(k) ? [] : base[k] || [])];
  }
  out.news = custom.news ? { ...base.news, ...custom.news } : base.news;
  return out;
}

export function isDue(team, lastBuilt, now, defaultEvery) {
  const every = (team.every || defaultEvery || 60) * 60000;
  return !lastBuilt || now - lastBuilt >= every - 120000;
}

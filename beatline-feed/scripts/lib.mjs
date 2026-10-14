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

export function dedupe(items) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  const out = [];
  for (const it of items) {
    const nt = normalizeTitle(it.title);
    if (!it.title || seenUrl.has(it.url) || seenTitle.has(nt)) continue;
    seenUrl.add(it.url);
    seenTitle.add(nt);
    out.push(it);
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
    next,
  };
}

export function readEspnRoster(rosterJson) {
  const groups = rosterJson?.athletes || [];
  const list = [];
  for (const g of groups) {
    const athletes = Array.isArray(g.items) ? g.items : [g];
    for (const a of athletes) {
      if (!a?.fullName && !a?.displayName) continue;
      list.push({
        name: a.fullName || a.displayName,
        pos: a.position?.abbreviation || '',
        num: a.jersey ? Number(a.jersey) : undefined,
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

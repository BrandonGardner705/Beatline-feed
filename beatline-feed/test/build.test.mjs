import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTeam } from '../scripts/build.mjs';
import { parseFeed, isRelevant, tagPlayers, formatDuration, readEspnTeam, splitGoogleTitle, fallbackSummary, channelIdFromHtml } from '../scripts/lib.mjs';

const now = Date.now();
const rfc = (minsAgo) => new Date(now - minsAgo * 60000).toUTCString();
const iso = (minsAgo) => new Date(now - minsAgo * 60000).toISOString();

const googleXml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Google News</title>
<item><title>Bronco Mendenhall says Aggies are close after Pac-12 loss - Deseret News</title><link>https://news.google.com/a1</link><pubDate>${rfc(30)}</pubDate><description>&lt;a&gt;x&lt;/a&gt;</description><source url="https://www.deseret.com">Deseret News</source></item>
<item><title>Utah State QB McCae Hillstead expected to start Saturday - KSL.com</title><link>https://news.google.com/a2</link><pubDate>${rfc(90)}</pubDate><source url="https://www.ksl.com">KSL.com</source></item>
<item><title>Texas A&amp;M Aggies roll in SEC opener - ESPN</title><link>https://news.google.com/a3</link><pubDate>${rfc(60)}</pubDate><source url="https://espn.com">ESPN</source></item>
<item><title>Utah State QB McCae Hillstead expected to start Saturday - Herald Journal</title><link>https://news.google.com/a4</link><pubDate>${rfc(95)}</pubDate><source url="https://www.hjnews.com">Herald Journal</source></item>
<item><title>Old story about Utah State from last year - Salt Lake Tribune</title><link>https://news.google.com/a5</link><pubDate>${rfc(60 * 24 * 40)}</pubDate><source url="https://sltrib.com">Salt Lake Tribune</source></item>
</channel></rss>`;

const podXml = `<?xml version="1.0"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>The Aggship Podcast</title><itunes:image href="https://img/aggship.jpg"/>
<item><title>Breaking down the Boise State game with Javen Jacobs</title><link>https://pod/ep1</link><pubDate>${rfc(200)}</pubDate><enclosure url="https://pod/ep1.mp3" type="audio/mpeg"/><itunes:duration>3125</itunes:duration><description>Javen Jacobs and the run game, plus what is next.</description></item>
</channel></rss>`;

const ytXml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/"><title>KSL Sports</title>
<entry><yt:videoId>abc123</yt:videoId><title>Utah State postgame: Bronco Mendenhall press conference</title><link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/><published>${iso(120)}</published><media:group><media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg"/><media:description>Full presser.</media:description></media:group></entry>
<entry><yt:videoId>zzz</yt:videoId><title>Jazz summer league recap</title><link rel="alternate" href="https://www.youtube.com/watch?v=zzz"/><published>${iso(130)}</published></entry>
</feed>`;

const espnTeam = { team: { id: '328', displayName: 'Utah State Aggies', color: '00263a', alternateColor: 'ffffff', standingSummary: '1st in Pac-12', record: { items: [{ type: 'total', summary: '3-3' }] },
  nextEvent: [{ date: new Date(now + 3 * 864e5).toISOString(), shortName: 'USU @ BSU', competitions: [{ competitors: [{ id: '328', homeAway: 'away', team: { id: '328', displayName: 'Utah State Aggies' } }, { id: '68', homeAway: 'home', team: { id: '68', displayName: 'Boise State Broncos' } }], status: { type: { state: 'pre' } } }] }] } };
const espnRoster = { athletes: [{ position: 'offense', items: [{ fullName: 'McCae Hillstead', position: { abbreviation: 'QB' }, jersey: '10' }, { fullName: 'Javen Jacobs', position: { abbreviation: 'RB' }, jersey: '4' }] }] };

function mockFetch(url) {
  const body = (() => {
    if (url.includes('news.google.com')) return googleXml;
    if (url.includes('itunes.apple.com')) return JSON.stringify({ results: [{ collectionName: 'The Aggship Podcast', feedUrl: 'https://pod/feed' }] });
    if (url === 'https://pod/feed') return podXml;
    if (url.includes('youtube.com/@')) return '<html>"channelId":"UCxxxxxxxxxxxxxxxxxxxxxx"</html>';
    if (url.includes('feeds/videos.xml')) return ytXml;
    if (url.endsWith('/roster')) return JSON.stringify(espnRoster);
    if (url.includes('site.api.espn.com')) return JSON.stringify(espnTeam);
    return null;
  })();
  if (body === null) return Promise.resolve(new Response('nope', { status: 404 }));
  return Promise.resolve(new Response(body, { status: 200 }));
}

const usu = {
  id: 'usu', short: 'USU', name: 'Utah State Football', city: 'Logan',
  espn: { sport: 'football', league: 'college-football', id: 328 },
  match: ['Utah State', 'USU', 'Bronco Mendenhall'], matchWeak: ['Aggies'],
  exclude: ['Texas A&M'],
  news: { queries: ['"Utah State" football'], sites: ['hjnews.com'] },
  podcasts: [{ search: 'The Aggship Podcast', name: 'The Aggship Podcast' }],
  youtube: [{ name: 'KSL Sports', handle: '@KSLSports' }],
  rss: [{ name: 'Broken feed', url: 'https://broken/feed' }],
  social: [{ player: 'McCae Hillstead', platform: 'X', profile: 'https://x.com/example' }],
};

test('builds a full team feed from every source type', async () => {
  const cache = { podcasts: {}, channels: {}, summaries: {} };
  const r = await buildTeam(usu, { fetchImpl: mockFetch, cache, windowDays: 10 });

  assert.equal(r.team.conference, 'Pac-12');
  assert.equal(r.team.record, '3-3');
  assert.equal(r.team.color, '#00263a');
  assert.equal(r.team.next.opponent, 'Boise State Broncos');
  assert.equal(r.team.next.home, false);

  const titles = r.items.map((i) => i.title);
  assert.ok(titles.includes('Bronco Mendenhall says Aggies are close after Pac-12 loss'), 'google title source suffix stripped');
  assert.ok(!titles.some((t) => t.includes('Texas A&M')), 'other Aggies filtered out');
  assert.ok(!titles.some((t) => t.includes('Jazz')), 'off-topic video filtered out');
  assert.ok(!titles.some((t) => t.includes('last year')), 'old items dropped');
  assert.equal(titles.filter((t) => t.startsWith('Utah State QB McCae Hillstead')).length, 1, 'duplicate story across outlets collapsed');

  const kinds = new Set(r.items.map((i) => i.kind));
  assert.ok(kinds.has('news') && kinds.has('pod') && kinds.has('video'));

  const pod = r.items.find((i) => i.kind === 'pod');
  assert.equal(pod.duration, '52 min');
  assert.deepEqual(pod.players, ['Javen Jacobs']);
  assert.equal(pod.image, 'https://img/aggship.jpg');

  const vid = r.items.find((i) => i.kind === 'video');
  assert.equal(vid.image, 'https://i.ytimg.com/vi/abc123/hqdefault.jpg');

  const qb = r.players.find((p) => p.name === 'McCae Hillstead');
  assert.equal(qb.mentions, 1);
  assert.equal(qb.socials[0].platform, 'X');

  assert.ok(r.status.some((s) => s.source === 'RSS: Broken feed' && !s.ok), 'broken source reported, not fatal');
  for (let i = 1; i < r.items.length; i++) assert.ok(r.items[i - 1].at >= r.items[i].at, 'newest first');
  assert.equal(r.brief.length, 2, 'fallback brief uses top news headlines');
});

test('helpers', () => {
  assert.equal(formatDuration('3125'), '52 min');
  assert.equal(formatDuration('00:06:41'), '6:41');
  assert.equal(formatDuration('1:02:00'), '62 min');
  assert.equal(splitGoogleTitle('A long headline about BYU - KSL.com', 'KSL.com'), 'A long headline about BYU');
  assert.ok(isRelevant('BYU wins big', { match: ['BYU'], exclude: [] }));
  assert.ok(!isRelevant('byu-ish typo', { match: ['BYU'], exclude: [] }), 'short acronyms are case sensitive');
  assert.ok(!isRelevant('Utah State beats Wyoming', { match: ['Utah Utes', 'Utes'], exclude: ['Utah State'] }));
  assert.deepEqual(tagPlayers('Great game by Jake Retzlaff today', [{ name: 'Jake Retzlaff' }, { name: 'Bob' }]), ['Jake Retzlaff']);
  assert.equal(fallbackSummary('Title here', 'Title here and more'), undefined);
  assert.equal(channelIdFromHtml('"channelId":"UCreL2UlUK2cV2OXZ4SGstBQ"'), 'UCreL2UlUK2cV2OXZ4SGstBQ');
  assert.equal(readEspnTeam({ team: { standingSummary: '3rd in Big 12' } }).conference, 'Big 12');
  assert.equal(parseFeed('not xml').items.length, 0);
});

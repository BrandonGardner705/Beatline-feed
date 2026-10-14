import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTeam, loadRecipes } from '../scripts/build.mjs';

const ago = (m) => new Date(Date.now() - m * 60000);

function mockFetch(url) {
  let body = null;
  if (url.includes('bing.com/news')) {
    body = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>Jazz rookie impresses in preseason</title><link>http://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2fwww.nba.com%2fjazz%2fnews%2frookie</link><pubDate>${ago(40).toUTCString()}</pubDate><description>The Utah Jazz rookie scored 20.</description></item>
      <item><title>Jazz festival announces lineup</title><link>https://example.com/fest</link><pubDate>${ago(50).toUTCString()}</pubDate><description>A jazz music event downtown.</description></item>
    </channel></rss>`;
  } else if (url.includes('entity=podcastEpisode')) {
    body = JSON.stringify({ results: [
      { collectionName: 'The Lowe Post', trackName: 'Western Conference preview: the Utah Jazz rebuild', trackViewUrl: 'https://podcasts.apple.com/ep/1', releaseDate: ago(300).toISOString(), trackTimeMillis: 3540000, artworkUrl600: 'https://img/lowe.jpg' },
      { collectionName: 'Cooking Hour', trackName: 'Smooth jazz dinner recipes', trackViewUrl: 'https://podcasts.apple.com/ep/2', releaseDate: ago(300).toISOString() },
    ] });
  } else if (url.includes('reddit.com/r/UtahJazz')) {
    body = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Game thread: Jazz vs Nuggets</title><link href="https://www.reddit.com/r/UtahJazz/comments/abc"/><updated>${ago(20).toISOString()}</updated><content>Discuss</content></entry></feed>`;
  } else if (url.includes('site.api.espn.com')) {
    body = url.endsWith('/roster') ? JSON.stringify({ athletes: [] }) : JSON.stringify({ team: { id: '26', standingSummary: '5th in Northwest Division' } });
  }
  return Promise.resolve(body === null ? new Response('', { status: 404 }) : new Response(body, { status: 200 }));
}

const jazz = {
  id: 'nba-26', name: 'Utah Jazz', short: 'JAZZ', league: 'nba',
  espn: { sport: 'basketball', league: 'nba', id: 26 },
  match: ['Utah Jazz'], matchWeak: ['Jazz'], exclude: ['jazz festival', 'jazz music'],
  news: { bing: ['Utah Jazz'] },
  episodeSearch: ['Utah Jazz'],
  reddit: [{ sub: 'UtahJazz', teamOnly: true }],
  youtubeSearch: ['Utah Jazz'],
};

test('broad search engines find sources nobody listed', async () => {
  const cache = { podcasts: {}, channels: {}, summaries: {} };
  const r = await buildTeam(jazz, { fetchImpl: mockFetch, cache, windowDays: 10 });
  const titles = r.items.map((i) => i.title);

  const bing = r.items.find((i) => i.title === 'Jazz rookie impresses in preseason');
  assert.ok(bing, 'Bing news item kept');
  assert.equal(bing.url, 'https://www.nba.com/jazz/news/rookie', 'Bing redirect unwrapped to the real outlet');
  assert.equal(bing.source, 'nba.com');
  assert.ok(!titles.includes('Jazz festival announces lineup'), 'music jazz filtered out');

  const ep = r.items.find((i) => i.show === 'The Lowe Post');
  assert.ok(ep, 'national podcast episode about the team found');
  assert.equal(ep.duration, '59 min');
  assert.ok(!titles.includes('Smooth jazz dinner recipes'));

  assert.ok(r.items.some((i) => i.kind === 'social' && i.source === 'r/UtahJazz'), 'subreddit posts included');

  const yt = r.status.find((s) => s.source.startsWith('Any YouTube channel'));
  assert.equal(yt.ok, false);
  assert.match(yt.error, /YOUTUBE_API_KEY/, 'YouTube search explains it needs a key');
});

test('launch config builds only the four custom teams', async () => {
  const { config, recipes } = await loadRecipes();
  assert.equal(config.autoTeams, false);
  assert.deepEqual([...recipes.keys()].sort(), ['college-football-252', 'college-football-254', 'college-football-328', 'nba-26']);
  for (const t of recipes.values()) {
    assert.ok(t.podcasts.length >= 6, `${t.name} has a wide podcast list`);
    assert.ok(t.episodeSearch?.length, `${t.name} searches every podcast`);
    assert.ok(t.news.bing?.length && t.news.queries?.length, `${t.name} uses two news engines`);
    assert.ok(t.news.sitesFans?.length && t.news.sitesNational?.length, `${t.name} covers fan and national outlets`);
    assert.equal(t.every, 20);
  }
});

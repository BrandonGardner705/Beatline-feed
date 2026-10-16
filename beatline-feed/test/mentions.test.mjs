import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTeam, mentionQueries } from '../scripts/build.mjs';

const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
const ok = (body) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));

const team = {
  id: 't', name: 'Utah State Football', espn: { sport: 'football', league: 'college-football', id: 328 }, match: ['Utah State'], exclude: [],
  social: [
    { name: 'Utah State Football', platform: 'Bluesky', handle: 'usufootball.bsky.social', profile: 'https://bsky.app/profile/usufootball.bsky.social' },
    { player: 'McCae Hillstead', platform: 'Bluesky', handle: 'mccae.bsky.social', profile: 'https://bsky.app/profile/mccae.bsky.social' },
  ],
  youtube: [{ name: 'Utah State Football', channelId: 'UC_2jW3CrLREur3IZzQ-1bug' }],
  mentions: { x: true },
};

function mock(url, opts) {
  if (url.includes('createSession')) return ok({ accessJwt: 'jwt' });
  if (url.includes('app.bsky.feed.searchPosts')) {
    assert.equal(opts.headers.authorization, 'Bearer jwt');
    return ok({ posts: [
      { uri: 'at://d/app.bsky.feed.post/1', author: { handle: 'fan.bsky.social', displayName: 'Aggie Fan' }, record: { text: 'Utah State defense with McCae Hillstead looked great', createdAt: iso(20) } },
      { uri: 'at://d/app.bsky.feed.post/2', author: { handle: 'usufootball.bsky.social', displayName: 'USU' }, record: { text: 'Utah State game day', createdAt: iso(25) } },
    ] });
  }
  if (url.includes('public.api.bsky.app') && url.includes('usufootball')) return ok({ feed: [{ post: { uri: 'at://d/x/3', record: { text: 'Game day in Logan', createdAt: iso(30) } } }] });
  if (url.includes('public.api.bsky.app')) return ok({ feed: [{ post: { uri: 'at://d/x/4', record: { text: 'Locked in', createdAt: iso(35) } } }] });
  if (url.includes('tweets/search/recent')) return ok({ data: [{ id: '7', text: 'Utah State fans travel well', created_at: iso(40), author_id: 'u1' }], includes: { users: [{ id: 'u1', username: 'logan_fan', name: 'Logan Fan' }] }, meta: { newest_id: '7' } });
  if (url.includes('youtube.com/feeds')) return Promise.resolve(new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><title>USU</title><entry><yt:videoId>abcdefghijk</yt:videoId><title>Week 8 hype video</title><link href="https://www.youtube.com/watch?v=abcdefghijk"/><published>${iso(50)}</published></entry></feed>`, { status: 200 }));
  if (url.includes('youtube.com/channel') || url.includes('youtube.com/@')) return Promise.resolve(new Response('', { status: 404 }));
  if (url.includes('site.api.espn.com')) return ok(url.endsWith('/roster') ? { athletes: [{ items: [{ fullName: 'McCae Hillstead' }] }] } : { team: {} });
  return Promise.resolve(new Response('', { status: 404 }));
}

test('mention search defaults to the team name plus the sport', () => {
  assert.deepEqual(mentionQueries(team), ['"Utah State" football']);
  assert.deepEqual(mentionQueries({ ...team, mentions: { queries: ['#AggiesAllTheWay'] } }), ['#AggiesAllTheWay']);
});

test('posts are labeled team, player or fan, and fans mentioning a player are tagged', async () => {
  Object.assign(process.env, { BSKY_HANDLE: 'me.bsky.social', BSKY_APP_PASSWORD: 'pw', X_BEARER_TOKEN: 'x' });
  delete process.env.YOUTUBE_API_KEY;
  try {
    const cache = { podcasts: {}, channels: { 'Utah State Football': 'UC_2jW3CrLREur3IZzQ-1bug' }, summaries: {} };
    const r = await buildTeam(team, { fetchImpl: mock, cache, windowDays: 10 });
    const by = (b) => r.items.filter((i) => i.by === b).map((i) => i.title).sort();
    assert.deepEqual(by('player'), ['Locked in']);
    assert.ok(by('team').includes('Game day in Logan'));
    assert.deepEqual(by('fan'), ['Utah State defense with McCae Hillstead looked great', 'Utah State fans travel well']);
    const fan = r.items.find((i) => i.by === 'fan' && i.platform === 'Bluesky');
    assert.deepEqual(fan.players, ['McCae Hillstead']);
    assert.equal(fan.handle, 'fan.bsky.social');
    assert.equal(fan.source, 'Aggie Fan on Bluesky');
    assert.ok(!r.items.some((i) => i.title === 'Utah State game day'), "team's own post is not counted as a mention");
  } finally {
    for (const k of ['BSKY_HANDLE', 'BSKY_APP_PASSWORD', 'X_BEARER_TOKEN']) delete process.env[k];
  }
});

test('without a Bluesky login, mention search is skipped quietly', async () => {
  const cache = { podcasts: {}, channels: {}, summaries: {} };
  const r = await buildTeam({ ...team, mentions: undefined, youtube: [] }, { fetchImpl: mock, cache, windowDays: 10 });
  const s = r.status.find((x) => x.source.startsWith('Mentions on Bluesky'));
  assert.equal(s.ok, true);
  assert.match(s.note, /BSKY_APP_PASSWORD/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTeam } from '../scripts/build.mjs';

const ago = (m) => new Date(Date.now() - m * 60000).toUTCString();
const ok = (body, type = 'text/html') => Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': type } }));

function mock(url, opts) {
  if (url.includes('news.google.com/rss/search')) return ok(`<?xml version="1.0"?><rss><channel>
    <item><title>BYU stuns Notre Dame - Deseret News</title><link>https://news.google.com/rss/articles/CBMiAAA?oc=5</link><pubDate>${ago(30)}</pubDate><source url="https://deseret.com">Deseret News</source></item>
    <item><title>BYU Cougars rally late in football win - KSL.com</title><link>https://news.google.com/rss/articles/CBMiBBB?oc=5</link><pubDate>${ago(40)}</pubDate><source url="https://ksl.com">KSL.com</source></item>
  </channel></rss>`, 'text/xml');
  if (url.startsWith('https://news.google.com/rss/articles/CBMiAAA')) return ok('<c-wiz><div jscontroller="x" data-n-a-sg="SIGA" data-n-a-ts="111"></div></c-wiz>');
  if (url.startsWith('https://news.google.com/rss/articles/CBMiBBB')) return ok('<c-wiz><div jscontroller="x" data-n-a-sg="SIGB" data-n-a-ts="222"></div></c-wiz>');
  if (url.includes('batchexecute')) {
    const req = JSON.parse(decodeURIComponent(opts.body.slice(6)))[0];
    const rows = req.map(([, inner, , key]) => {
      const id = JSON.parse(inner)[2];
      return ['wrb.fr', 'Fbv4je', JSON.stringify(['garturlres', id === 'CBMiAAA' ? 'https://www.deseret.com/byu-stuns' : 'https://www.ksl.com/rally', 1]), null, null, null, key];
    });
    return ok(`)]}'\n\n${JSON.stringify([...rows, ['di', 10]])}`, 'application/json');
  }
  if (url === 'https://www.deseret.com/byu-stuns') return ok('<meta property="og:image" content="https://cdn.deseret.com/hero.jpg"><meta property="og:description" content="The Cougars won in South Bend for the first time.">');
  if (url === 'https://www.ksl.com/rally') return ok('<meta name="twitter:image" content="https://ksl.com/r.jpg">');
  if (url.endsWith('/roster')) return ok(JSON.stringify({ athletes: [{ items: [{ id: '5001', fullName: 'Bear Bachmeier', jersey: '47', position: { abbreviation: 'QB', displayName: 'Quarterback' }, headshot: { href: 'https://a.espncdn.com/h/5001.png' }, displayHeight: "6' 1\"", displayWeight: '220 lbs', experience: { displayValue: 'Sophomore' }, birthPlace: { city: 'Murrieta', state: 'CA' } }] }] }), 'application/json');
  if (url.includes('site.api.espn.com')) return ok(JSON.stringify({ team: {} }), 'application/json');
  return Promise.resolve(new Response('', { status: 404 }));
}

const team = { id: 'byu', name: 'BYU', espn: { sport: 'football', league: 'college-football', id: 252 }, match: ['BYU'], matchWeak: ['Cougars'], exclude: [], news: { queries: ['BYU'] } };

test('Google News links become real article links with a picture and description', async () => {
  const cache = { podcasts: {}, channels: {}, summaries: {} };
  const r = await buildTeam(team, { fetchImpl: mock, cache, windowDays: 10 });
  const byUrl = Object.fromEntries(r.items.map((i) => [i.url, i]));
  assert.ok(byUrl['https://www.deseret.com/byu-stuns'], 'decoded to the outlet');
  assert.equal(byUrl['https://www.deseret.com/byu-stuns'].image, 'https://cdn.deseret.com/hero.jpg');
  assert.equal(byUrl['https://www.deseret.com/byu-stuns'].summary, 'The Cougars won in South Bend for the first time.');
  assert.equal(byUrl['https://www.ksl.com/rally'].image, 'https://ksl.com/r.jpg');
  assert.equal(cache.gnews.CBMiAAA, 'https://www.deseret.com/byu-stuns', 'decoded link cached');
});

test('player profiles carry headshot and bio from ESPN', async () => {
  const r = await buildTeam(team, { fetchImpl: mock, cache: { podcasts: {}, channels: {}, summaries: {} }, windowDays: 10 });
  const p = r.players[0];
  assert.equal(p.photo, 'https://a.espncdn.com/h/5001.png');
  assert.equal(p.hometown, 'Murrieta, CA');
  assert.equal(p.year, 'Sophomore');
  assert.equal(p.height, "6' 1\"");
});

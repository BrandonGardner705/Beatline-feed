import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mergeRecipe, isDue, recipeFromEspn } from '../scripts/lib.mjs';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const espnLeague = (teams) => JSON.stringify({ sports: [{ leagues: [{ teams: teams.map((team) => ({ team })) }] }] });
const cfbTeams = [
  { id: '252', location: 'BYU', name: 'Cougars', displayName: 'BYU Cougars', abbreviation: 'BYU', color: '0062b8' },
  { id: '254', location: 'Utah', name: 'Utes', displayName: 'Utah Utes', abbreviation: 'UTAH', color: 'cc0000' },
  { id: '328', location: 'Utah State', name: 'Aggies', displayName: 'Utah State Aggies', abbreviation: 'USU', color: '00263a' },
  { id: '68', location: 'Boise State', name: 'Broncos', displayName: 'Boise State Broncos', abbreviation: 'BSU', color: '0033a0' },
];
const nbaTeams = [{ id: '26', location: 'Utah', name: 'Jazz', displayName: 'Utah Jazz', abbreviation: 'UTAH', color: '4e008e' }];

const news = (title, src) => `<?xml version="1.0"?><rss version="2.0"><channel><item><title>${title} - ${src}</title><link>https://news.google.com/${encodeURIComponent(title)}</link><pubDate>${new Date(Date.now() - 3600e3).toUTCString()}</pubDate><source url="https://x.com">${src}</source></item></channel></rss>`;

let calls = 0;
function mockFetch(url) {
  calls++;
  let body = null;
  if (url.includes('/college-football/teams?')) body = espnLeague(cfbTeams);
  else if (url.includes('/nba/teams?')) body = espnLeague(nbaTeams);
  else if (url.includes('site.api.espn.com') && url.endsWith('/roster')) body = JSON.stringify({ athletes: [] });
  else if (url.includes('site.api.espn.com/apis/site/v2/sports/') && /\/teams\/\d+$/.test(url)) {
    const id = url.split('/').pop();
    body = JSON.stringify({ team: { id, displayName: `Team ${id}`, standingSummary: '2nd in Pac-12', record: { items: [{ type: 'total', summary: '4-2' }] } } });
  } else if (url.includes('news.google.com')) {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    if (q.includes('Boise')) body = news('Boise State Broncos win at home', 'Idaho Statesman');
    else if (q.includes('Utah State')) body = news('Utah State Aggies prep for Boise State', 'Herald Journal');
    else if (q.includes('BYU')) body = news('BYU Cougars stay unbeaten', 'Deseret News');
    else body = news('Utah Utes and Utah Jazz both play this week', 'KSL.com');
  } else if (url.includes('itunes.apple.com/search')) body = JSON.stringify({ results: [] });
  else if (url.includes('itunes.apple.com/lookup')) body = JSON.stringify({ results: [] });
  if (body === null) return Promise.resolve(new Response('', { status: 404 }));
  return Promise.resolve(new Response(body, { status: 200 }));
}

test('league generation, custom recipes and per-team schedules', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'beatline-'));
  try {
    await cp(path.join(REPO, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
    await cp(path.join(REPO, 'config/teams'), path.join(dir, 'config/teams'), { recursive: true });
    await symlink(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'));
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
    const leagues = {
      windowDays: 10, maxRunMinutes: 5,
      featured: ['college-football-252', 'college-football-328'],
      leagues: [
        { id: 'college-football', name: 'College Football', sport: 'football', league: 'college-football', every: 60, query: 'groups=80', suffix: 'Football' },
        { id: 'nba', name: 'NBA', sport: 'basketball', league: 'nba', every: 20 },
      ],
    };
    await mkdir(path.join(dir, 'config'), { recursive: true });
    await writeFile(path.join(dir, 'config/leagues.json'), JSON.stringify(leagues));

    const { main } = await import(path.join(dir, 'scripts/build.mjs'));
    const t0 = Date.now();
    const run1 = await main({ fetchImpl: mockFetch, now: t0 });

    // Every team in both leagues got built on the first run: 4 college + 1 NBA.
    assert.equal(run1.totalTeams, 5);
    assert.equal(run1.built.length, 5);

    const dirIndex = JSON.parse(await readFile(path.join(dir, 'public/leagues.json'), 'utf8'));
    assert.deepEqual(dirIndex.leagues.map((l) => [l.id, l.teams]), [['college-football', 4], ['nba', 1]]);
    assert.equal(dirIndex.featured[0].id, 'college-football-252');

    const cfb = JSON.parse(await readFile(path.join(dir, 'public/leagues/college-football.json'), 'utf8'));
    const boise = cfb.teams.find((t) => t.id === 'college-football-68');
    assert.equal(boise.mode, 'auto', 'teams with no custom file run on the automatic recipe');
    assert.equal(cfb.teams.find((t) => t.id === 'college-football-328').mode, 'tuned', 'custom file wins');

    const usu = JSON.parse(await readFile(path.join(dir, 'public/teams/college-football-328.json'), 'utf8'));
    assert.equal(usu.team.conference, 'Pac-12');
    assert.ok(usu.items.some((i) => i.title === 'Utah State Aggies prep for Boise State'));

    const utah = JSON.parse(await readFile(path.join(dir, 'public/teams/college-football-254.json'), 'utf8'));
    assert.ok(!utah.items.some((i) => i.title.includes('Utah State')), 'Utah feed excludes Utah State stories');

    // 25 minutes later: the 20-minute NBA team is due again, the 60-minute default teams are not,
    // and the custom college teams set to every 20 are due.
    const run2 = await main({ fetchImpl: mockFetch, now: t0 + 25 * 60000 });
    assert.ok(run2.built.includes('nba-26'));
    assert.ok(run2.built.includes('college-football-252'));
    assert.ok(!run2.built.includes('college-football-68'), 'hourly team waits its turn');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('recipe helpers', () => {
  const L = { id: 'premier-league', sport: 'soccer', league: 'eng.1', region: 'GB' };
  const all = [{ id: '1', location: 'Manchester United', name: 'Manchester United', displayName: 'Manchester United' }, { id: '2', location: 'Manchester City', name: 'Manchester City', displayName: 'Manchester City' }];
  const r = recipeFromEspn(all[0], L, all);
  assert.equal(r.region, 'GB');
  assert.deepEqual(r.news.queries, ['"Manchester United"']);

  const merged = mergeRecipe({ podcasts: [{ discover: 'X' }], match: ['A'], news: { queries: ['q'] } }, { podcasts: [{ appleId: 1 }], match: ['B'] });
  assert.equal(merged.podcasts.length, 2, 'custom sources add to automatic ones');
  assert.deepEqual(merged.match, ['B'], 'custom matching rules replace automatic ones');
  assert.equal(merged.auto, false);

  const now = Date.now();
  assert.ok(isDue({ every: 20 }, now - 21 * 60000, now));
  assert.ok(!isDue({ every: 60 }, now - 21 * 60000, now));
  assert.ok(isDue({}, undefined, now));
});

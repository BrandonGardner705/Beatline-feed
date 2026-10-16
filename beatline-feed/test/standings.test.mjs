import test from 'node:test';
import assert from 'node:assert/strict';
import { readStandings, readSchedule, raceFromSchedules, readEspnTeam } from '../scripts/lib.mjs';

const row = (id, abbr, conf, total, seed) => ({
  team: { id, abbreviation: abbr, displayName: abbr + ' U' },
  stats: [{ type: 'vsconf', summary: conf }, { type: 'total', summary: total }, { name: 'playoffSeed', value: seed }, { name: 'streak', displayValue: 'W1' }],
});
const standingsJson = { name: 'Big 12 Conference', abbreviation: 'B12', standings: { entries: [row('2', 'TTU', '2-0', '5-0', 2), row('1', 'BYU', '3-0', '5-0', 1), row('3', 'UTAH', '2-1', '4-1', 3), row('4', 'KU', '0-3', '1-4', 4)] } };
const NOW = Date.parse('2026-10-16T12:00:00Z');
const ev = (date, us, them, home, done, win) => ({
  date, competitions: [{ status: { type: { completed: done } }, competitors: [
    { team: { id: us }, homeAway: home ? 'home' : 'away', winner: win },
    { team: { id: them, abbreviation: 'X' + them, displayName: 'Team ' + them }, homeAway: home ? 'away' : 'home' },
  ] }],
});

test('standings, schedules and the race', () => {
  const t = readStandings(standingsJson);
  assert.equal(t.name, 'Big 12 Conference');
  assert.deepEqual(t.rows.map((r) => r.short), ['BYU', 'TTU', 'UTAH', 'KU']);
  assert.equal(t.rows[0].confW, 3);

  const schedules = {
    1: readSchedule({ events: [ev('2026-10-10T20:00Z', '1', '4', true, true, true), ev('2026-10-17T20:00Z', '1', '99', true, false), ev('2026-11-07T20:00Z', '1', '3', false, false), ev('2026-11-14T20:00Z', '1', '2', true, false)] }, '1'),
    2: readSchedule({ events: [ev('2026-10-24T20:00Z', '2', '3', true, false), ev('2026-11-14T20:00Z', '2', '1', false, false)] }, '2'),
    3: readSchedule({ events: [ev('2026-10-24T20:00Z', '3', '2', false, false), ev('2026-11-07T20:00Z', '3', '1', true, false)] }, '3'),
    4: [],
  };
  assert.equal(schedules[1][0].win, true);
  const race = raceFromSchedules(t, schedules, '1', NOW);
  assert.deepEqual(race.remaining.map((g) => g.oppShort), ['UTAH', 'TTU'], 'non-conference game left out');
  assert.equal(race.rows.find((r) => r.short === 'TTU').maxW, 4);
  assert.deepEqual(race.watch, [{ date: Date.parse('2026-10-24T20:00Z'), home: 'TTU', away: 'UTAH' }]);
});

test('team endpoint gives the conference group', () => {
  assert.equal(readEspnTeam({ team: { groups: { id: '4', isConference: true } } }).groupId, '4');
});

test('national polls: top 25, our rank and votes', async () => {
  const { readPolls } = await import('../scripts/lib.mjs');
  const team = (id, loc, name, abbr) => ({ id, location: loc, name, abbreviation: abbr });
  const json = { rankings: [
    { name: 'AP Top 25', shortName: 'AP Poll', type: 'ap', ranks: [
      { current: 2, previous: 2, points: 1500, team: team('87', 'Notre Dame', 'Fighting Irish', 'ND'), recordSummary: '6-0' },
      { current: 8, previous: 10, points: 1100, team: team('252', 'BYU', 'Cougars', 'BYU'), recordSummary: '5-0' },
    ], others: [{ current: 0, points: 12, team: team('328', 'Utah State', 'Aggies', 'USU') }] },
    { name: 'Some Other Poll', shortName: 'Other', type: 'x', ranks: [{ current: 1, team: team('1', 'A', 'B', 'AB') }] },
  ] };
  const byu = readPolls(json, 252);
  assert.equal(byu.length, 1, 'only AP, Coaches and CFP kept');
  assert.deepEqual(byu[0].ours, { rank: 8, prev: 10 });
  assert.equal(byu[0].ranks[0].name, 'Notre Dame Fighting Irish');
  assert.equal(readPolls(json, 328)[0].receivingVotes, 12);
});

test('schedule carries score, TV and venue', () => {
  const g = readSchedule({ events: [{ date: '2026-10-10T20:00Z', competitions: [{
    status: { type: { completed: true, state: 'post', shortDetail: 'Final' } },
    broadcasts: [{ media: { shortName: 'ESPN' } }], venue: { fullName: 'LaVell Edwards Stadium', address: { city: 'Provo', state: 'UT' } },
    competitors: [
      { team: { id: '252' }, homeAway: 'home', winner: true, score: { value: 31, displayValue: '31' } },
      { team: { id: '66', abbreviation: 'ISU', displayName: 'Iowa State Cyclones' }, homeAway: 'away', score: { displayValue: '17' }, curatedRank: { current: 99 } },
    ] }] }] }, '252')[0];
  assert.deepEqual([g.us, g.them, g.win, g.tv, g.venue, g.city, g.oppRank], ['31', '17', true, 'ESPN', 'LaVell Edwards Stadium', 'Provo, UT', undefined]);
});

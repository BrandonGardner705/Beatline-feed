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

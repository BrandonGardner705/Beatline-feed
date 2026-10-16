import test from 'node:test';
import assert from 'node:assert/strict';
import { sportFilter, fitsSport } from '../scripts/lib.mjs';

const football = sportFilter({ espn: { sport: 'football' }, id: 'college-football-252', league: 'college-football', onTopic: ['Kalani Sitake'] });
const hoops = sportFilter({ espn: { sport: 'basketball' }, id: 'mens-college-basketball-252', league: 'mens-college-basketball', onTopic: ['Kevin Young'] });

test('each feed keeps to its own sport', () => {
  const cases = [
    ['BYU basketball adds a transfer guard', false, true],
    ['BYU football depth chart for Week 8', true, false],
    ['Kalani Sitake on the Cougars defense', true, true],
    ['Kevin Young: practice has been physical', true, true],
    ['BYU volleyball sweeps Baylor', false, false],
    ["Utah women's basketball opens at No. 18", false, false],
    ["BYU football and basketball both ranked this week", true, true],
    ['Cougars quarterback and the basketball roster reset', true, true],
    ['BYU announces new athletic director', true, true],
  ];
  for (const [text, inFootball, inHoops] of cases) {
    assert.equal(fitsSport(text, football), inFootball, `football: ${text}`);
    assert.equal(fitsSport(text, hoops), inHoops, `basketball: ${text}`);
  }
});

test('teams can turn the sport filter off', () => {
  assert.equal(sportFilter({ espn: { sport: 'football' }, sportFilter: false }), null);
  assert.equal(fitsSport('anything', null), true);
});

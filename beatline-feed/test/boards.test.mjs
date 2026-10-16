import test from 'node:test';
import assert from 'node:assert/strict';
import { parseXenForoThreads } from '../scripts/lib.mjs';
import { buildTeam } from '../scripts/build.mjs';

const thread = (id, title, replies, ts, sticky = false) => `<div class="structItem structItem--thread js-threadListItem-${id}" data-author="fan${id}">
  ${sticky ? '<i class="structItem-status structItem-status--sticky"></i>' : ''}
  <div class="structItem-title" uix-href="/boards/threads/x.${id}/"><a href="/boards/forums/x.1/?prefix_id=2" class="labelLink"><span>OT</span></a> <a href="/boards/threads/t.${id}/" data-tp-primary="on">${title}</a></div>
  <div class="structItem-cell structItem-cell--meta"><dl class="pairs pairs--justified"><dt>Replies</dt> <dd>${replies}</dd></dl></div>
  <div class="structItem-cell structItem-cell--latest"><a href="/boards/threads/t.${id}/latest"><time class="structItem-latestDate u-dt" data-timestamp="${ts}" datetime="2026-10-16T12:00:00-0600">x</time></a></div>
</div>`;

test('XenForo thread lists become board threads', () => {
  const now = Math.floor(Date.now() / 1000);
  const html = `<div>${thread(1, 'Rules of the board', 3, now - 99999, true)}${thread(2, 'Utes &amp; Buffs game thread', '1.2K', now - 60)}${thread(3, 'Recruiting notes', 8, now - 3600)}</div>`;
  const t = parseXenForoThreads(html, 'https://www.on3.com/boards/forums/utes.1249/');
  assert.deepEqual(t.map((x) => x.title), ['Utes & Buffs game thread', 'Recruiting notes'], 'pinned thread skipped, entities decoded');
  assert.equal(t[0].url, 'https://www.on3.com/boards/threads/t.2/');
  assert.equal(t[0].replies, 1200);
  assert.equal(t[0].author, 'fan2');
  assert.equal(t[1].at, (now - 3600) * 1000);
});

test('board feeds land in the feed as board threads with links back', async () => {
  const date = new Date(Date.now() - 30 * 60000).toUTCString();
  const fetchImpl = async (url) => {
    if (url.includes('cougarboard.com/rss')) return new Response(`<?xml version="1.0"?><rss version="2.0"><channel><title>CougarBoard</title>
      <item><title>Game day thread: BYU vs Notre Dame</title><link>http://www.cougarboard.com/board/message.html?id=1&amp;source=rss</link>
      <description>&lt;div&gt;Who is going?&lt;/div&gt;</description><author>1984coug</author><pubDate>${date}</pubDate></item></channel></rss>`, { status: 200 });
    if (url.includes('site.api.espn.com')) return new Response(JSON.stringify(url.endsWith('/roster') ? { athletes: [] } : { team: {} }), { status: 200 });
    return new Response('', { status: 404 });
  };
  const team = { id: 't', name: 'BYU Football', espn: { sport: 'football', league: 'college-football', id: 252 }, match: ['BYU'], exclude: [],
    boards: [{ name: 'CougarBoard', rss: 'https://www.cougarboard.com/rss/board.html?display=top10', url: 'https://www.cougarboard.com/board/list.html', teamOnly: true }],
    reddit: [{ sub: 'byu' }] };
  const r = await buildTeam(team, { fetchImpl, cache: { podcasts: {}, channels: {}, summaries: {} }, windowDays: 10 });
  const b = r.items.find((i) => i.kind === 'board');
  assert.equal(b.source, 'CougarBoard');
  assert.equal(b.author, '1984coug');
  assert.match(b.url, /^https:\/\/www\.cougarboard\.com/);
  assert.equal(b.summary, 'Who is going?');
  assert.deepEqual(r.boards.map((x) => x.name), ['CougarBoard', 'r/byu']);
});

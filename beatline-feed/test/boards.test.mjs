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

test('Discourse and phpBB fan forums become board threads, one per thread', async () => {
  const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
  const fetchImpl = async (url) => {
    if (url === 'https://forum.utefans.net/c/basketball/5/l/latest.json') return new Response(JSON.stringify({ topic_list: { topics: [
      { id: 1, slug: 'welcome', title: 'Welcome', pinned: true, posts_count: 2, last_posted_at: iso(5) },
      { id: 22, slug: 'utes-hoops-preview', title: 'Utes hoops preview', posts_count: 13, last_posted_at: iso(30), last_poster_username: 'redrock' },
    ] } }), { status: 200 });
    if (url === 'https://www.usufans.com/Forums/app.php/feed/forum/6') return new Response(`<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry><author><name><![CDATA[SLB]]></name></author><updated>${iso(10)}</updated><published>${iso(10)}</published>
        <link href="https://www.usufans.com/Forums/viewtopic.php?t=81101&amp;p=2#p2"/><title type="html"><![CDATA[Stew Morrill Court (Aggie Basketball) • Re: Exhibition thread]]></title>
        <content type="html"><![CDATA[Nice win<p>Statistics: Posted by SLB</p>]]></content></entry>
      <entry><author><name><![CDATA[Ag]]></name></author><updated>${iso(60)}</updated><published>${iso(60)}</published>
        <link href="https://www.usufans.com/Forums/viewtopic.php?t=81101&amp;p=1#p1"/><title type="html"><![CDATA[Stew Morrill Court (Aggie Basketball) • Exhibition thread]]></title>
        <content type="html"><![CDATA[Game day]]></content></entry></feed>`, { status: 200 });
    if (url.includes('site.api.espn.com')) return new Response(JSON.stringify(url.endsWith('/roster') ? { athletes: [] } : { team: {} }), { status: 200 });
    return new Response('', { status: 404 });
  };
  const base = { espn: { sport: 'basketball', league: 'mens-college-basketball', id: 1 }, exclude: [], sportStrict: true };
  const ute = await buildTeam({ ...base, id: 'u', name: 'Utah Basketball', match: ['Utah'], boards: [{ name: 'UteFans.net', discourse: 'https://forum.utefans.net/c/basketball/5', url: 'https://forum.utefans.net/c/basketball/5', sportSure: true }] },
    { fetchImpl, cache: { podcasts: {}, channels: {}, summaries: {} }, windowDays: 10 });
  const ub = ute.items.filter((i) => i.kind === 'board');
  assert.deepEqual(ub.map((b) => b.title), ['Utes hoops preview'], 'pinned topic skipped; no sport words needed');
  assert.equal(ub[0].url, 'https://forum.utefans.net/t/utes-hoops-preview/22');
  assert.equal(ub[0].replies, 12);
  const usu = await buildTeam({ ...base, id: 's', name: 'Utah State Basketball', match: ['Utah State'], boards: [{ name: 'USUFans.com', phpbb: 'https://www.usufans.com/Forums/app.php/feed/forum/6', url: 'https://www.usufans.com/Forums/viewforum.php?f=6', sportSure: true }] },
    { fetchImpl, cache: { podcasts: {}, channels: {}, summaries: {} }, windowDays: 10 });
  const sb = usu.items.filter((i) => i.kind === 'board');
  assert.equal(sb.length, 1, 'two posts in one thread become one item');
  assert.equal(sb[0].title, 'Exhibition thread');
  assert.equal(sb[0].url, 'https://www.usufans.com/Forums/viewtopic.php?t=81101');
  assert.equal(sb[0].author, 'SLB');
  assert.ok(Date.now() - sb[0].at < 15 * 60000, 'uses the newest post time');
  assert.ok(usu.boards.some((b) => b.name === 'USUFans.com' && /viewforum/.test(b.url)));
});

test('official Sidearm rosters fill in players ESPN is missing', async () => {
  const { parseSidearmRoster } = await import('../scripts/lib.mjs');
  const li = (n, name, pos, yr, town) => `<li class="sidearm-roster-list-item"><div class="sidearm-roster-list-item-photo"><img src="/images/${n}.jpg" alt="${name}" class="sidearm-roster-list-item-photo-img"> <div class="sidearm-roster-list-item-photo-number"><span>${n}</span></div></div>
    <div class="sidearm-roster-list-item-name sidearm-roster-player-name"><a href="/sports/mens-basketball/roster/x/${n}">${name}</a></div>
    <div class="sidearm-roster-list-item-meta"><!----> <span class="sidearm-roster-list-item-position">${pos}</span> <span class="sidearm-roster-list-item-year">${yr}</span> <span class="sidearm-roster-list-item-height">6' 5"</span> <span class="sidearm-roster-list-item-weight">190</span></div>
    <div class="sidearm-roster-list-item-hometown">${town}</div></li>`;
  const html = `<ul class="sidearm-roster-list reset-list">${li(0, 'Jax Allen', 'Guard', 'Fr.', 'Orem, Utah')}${li(14, 'Mason Falslev', 'Guard', 'Sr.', 'Logan, Utah')}</ul>`;
  const r = parseSidearmRoster(html, 'https://utahstateaggies.com/sports/mens-basketball/roster');
  assert.deepEqual(r.map((p) => [p.name, p.num, p.pos, p.year, p.hometown]), [['Jax Allen', 0, 'G', 'Fr.', 'Orem, Utah'], ['Mason Falslev', 14, 'G', 'Sr.', 'Logan, Utah']]);
  assert.equal(r[0].photo, 'https://utahstateaggies.com/images/0.jpg');
  assert.equal(r[0].weight, '190 lbs');

  const fetchImpl = async (url) => {
    if (url.endsWith('/roster') && url.includes('espn')) return new Response(JSON.stringify({ athletes: [{ fullName: 'Mason Falslev', jersey: '14', position: { abbreviation: 'G' } }] }), { status: 200 });
    if (url.includes('site.api.espn.com')) return new Response(JSON.stringify({ team: {} }), { status: 200 });
    if (url.includes('utahstateaggies.com')) return new Response(html, { status: 200 });
    return new Response('', { status: 404 });
  };
  const team = { id: 's', name: 'Utah State Basketball', espn: { sport: 'basketball', league: 'mens-college-basketball', id: 328 }, match: ['Utah State'], exclude: [],
    officialRoster: 'https://utahstateaggies.com/sports/mens-basketball/roster' };
  const out = await buildTeam(team, { fetchImpl, cache: { podcasts: {}, channels: {}, summaries: {} }, windowDays: 10 });
  assert.deepEqual(out.players.map((p) => p.name).sort(), ['Jax Allen', 'Mason Falslev'], 'no duplicate for the player both lists have');
});

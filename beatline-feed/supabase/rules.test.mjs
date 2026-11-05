// Tests the database rules in schema.sql against a local Postgres.
// Run: npm i @electric-sql/pglite && node rules.test.mjs schema.sql
// Runs supabase/schema.sql against a local Postgres with a minimal Supabase-like setup,
// then acts as different users to check the rules.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';

const db = new PGlite();
const setup = `
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
create role anon; create role authenticated;
create publication supabase_realtime;
`;
await db.exec(setup);
await db.exec(readFileSync(process.argv[2], 'utf8'));
await db.exec(`grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated; grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated;`);

const U = {
  byu: '11111111-1111-1111-1111-111111111111',
  ute: '22222222-2222-2222-2222-222222222222',
  troll: '33333333-3333-3333-3333-333333333333',
  mod: '44444444-4444-4444-4444-444444444444',
  newbie: '55555555-5555-5555-5555-555555555555',
};
for (const id of Object.values(U)) await db.query('insert into auth.users values ($1)', [id]);

let pass = 0, fail = 0;
async function as(uid, sql, params = []) {
  await db.exec(`reset role; select set_config('request.uid', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try { const r = await db.query(sql, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec('reset role'); }
}
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra); }
}
const admin = async (sql, p) => { await db.exec("reset role; select set_config('request.uid', '', false)"); return db.query(sql, p); };

console.log('profiles');
check('BYU fan creates profile', (await as(U.byu, `insert into profiles (id, display_name, home_team) values ($1,'CougarDad','school-252')`, [U.byu])).ok);
check('Ute fan creates profile', (await as(U.ute, `insert into profiles (id, display_name, home_team) values ($1,'UteNation','school-254')`, [U.ute])).ok);
check('troll creates profile', (await as(U.troll, `insert into profiles (id, display_name, home_team) values ($1,'Troll','school-254')`, [U.troll])).ok);
check('mod creates profile', (await as(U.mod, `insert into profiles (id, display_name, home_team) values ($1,'Mod','school-252')`, [U.mod])).ok);
check('newbie creates profile', (await as(U.newbie, `insert into profiles (id, display_name, home_team) values ($1,'Newbie','school-252')`, [U.newbie])).ok);
check("can't make yourself a moderator on signup", !(await as(U.troll, `insert into profiles (id, display_name, home_team, is_moderator) values ($1,'x','school-254',true)`, [U.troll])).ok);
check("can't create a profile for someone else", !(await as(U.troll, `insert into profiles (id, display_name, home_team) values ($1,'fake','school-252')`, ['66666666-6666-6666-6666-666666666666'])).ok);
// age everyone but newbie past the new-account wait; make mod a moderator
await admin(`update profiles set created_at = now() - interval '10 days', home_team_set_at = now() - interval '40 days' where id <> $1`, [U.newbie]);
await admin(`update profiles set is_moderator = true where id = $1`, [U.mod]);
check("can't promote yourself to moderator", !(await as(U.troll, `update profiles set is_moderator = true where id = $1`, [U.troll])).ok);
check('can switch home team after 30 days', (await as(U.troll, `update profiles set home_team = 'school-328' where id = $1`, [U.troll])).ok);
check("can't switch again within 30 days", !(await as(U.troll, `update profiles set home_team = 'school-254' where id = $1`, [U.troll])).ok);
await admin(`update profiles set home_team = 'school-254', home_team_set_at = now() - interval '40 days' where id = $1`, [U.troll]);
const other = await as(U.troll, `update profiles set display_name = 'hacked' where id = $1 returning id`, [U.byu]);
check("can't edit someone else's profile", other.ok && other.rows.length === 0);

console.log('reactions & shares');
check('BYU fan likes an item', (await as(U.byu, `insert into item_reactions (item_id, user_id, kind) values ('abc', $1, 'like')`, [U.byu])).ok);
check('BYU fan adds fire', (await as(U.byu, `insert into item_reactions (item_id, user_id, kind) values ('abc', $1, 'fire')`, [U.byu])).ok);
check('newbie can react right away', (await as(U.newbie, `insert into item_reactions (item_id, user_id, kind) values ('abc', $1, 'like')`, [U.newbie])).ok);
check("can't react as someone else", !(await as(U.troll, `insert into item_reactions (item_id, user_id, kind) values ('abc', $1, 'laugh')`, [U.byu])).ok);
check("can't use a made-up reaction", !(await as(U.byu, `insert into item_reactions (item_id, user_id, kind) values ('abc', $1, 'poop')`, [U.byu])).ok);
check('guests can read counts', (await as(null, `select count(*)::int n from item_reactions where item_id='abc'`)).rows?.[0]?.n === 3);
const del = await as(U.troll, `delete from item_reactions where user_id = $1 returning 1`, [U.byu]);
check("can't remove someone else's reaction", del.ok && del.rows.length === 0);
check('share is recorded', (await as(U.byu, `insert into item_shares (item_id, user_id) values ('abc', $1)`, [U.byu])).ok);

console.log('comments');
check('BYU fan comments on a BYU item', (await as(U.byu, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'Great game')`, [U.byu])).ok);
check("Ute fan can't comment in BYU's feed", !(await as(U.ute, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'lol')`, [U.ute])).ok);
check('Ute fan comments in Utah feed', (await as(U.ute, `insert into comments (item_id, team_id, user_id, body) values ('xyz','school-254',$1,'Go Utes')`, [U.ute])).ok);
check("new account must wait before commenting", !(await as(U.newbie, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'hi')`, [U.newbie])).ok);
check("guests can't comment", !(await as(null, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'hi')`, [U.byu])).ok);
check("empty comments rejected", !(await as(U.mod, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'')`, [U.mod])).ok);
check('anyone can read comments', (await as(null, `select count(*)::int n from comments`)).rows?.[0]?.n === 2);
// slow mode for young accounts (under 7 days)
await admin(`update profiles set created_at = now() - interval '1 day' where id = $1`, [U.mod]);
check('young account first comment ok', (await as(U.mod, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'one')`, [U.mod])).ok);
const slow = await as(U.mod, `insert into comments (item_id, team_id, user_id, body) values ('abc','school-252',$1,'two')`, [U.mod]);
check('young account slowed down on rapid second comment', !slow.ok && /Slow down/.test(slow.err), slow.err);
await admin(`update profiles set created_at = now() - interval '30 days' where id = $1`, [U.mod]);
const dc = await as(U.ute, `delete from comments where user_id = $1 returning 1`, [U.byu]);
check("can't delete someone else's comment", dc.ok && dc.rows.length === 0);

console.log('chat boards');
const th = await as(U.byu, `insert into threads (room, title, user_id) values ('school-252','QB battle?',$1) returning id`, [U.byu]);
check('BYU fan starts a thread on the BYU board', th.ok);
const tid = th.rows?.[0]?.id;
check("Ute fan can't start a thread on the BYU board", !(await as(U.ute, `insert into threads (room, title, user_id) values ('school-252','BYU stinks',$1)`, [U.ute])).ok);
check("Ute fan can't reply on the BYU board", !(await as(U.ute, `insert into posts (thread_id, user_id, body) values ($1,$2,'lol')`, [tid, U.ute])).ok);
check('Ute fan can read the BYU board', (await as(U.ute, `select count(*)::int n from threads where room='school-252'`)).rows?.[0]?.n === 1);
const rv = await as(U.ute, `insert into threads (room, title, user_id) values ('rivalry','Holy War week',$1) returning id`, [U.ute]);
check('Ute fan posts in the rivalry room', rv.ok);
check('BYU fan replies in the rivalry room', (await as(U.byu, `insert into posts (thread_id, user_id, body) values ($1,$2,'See you Saturday')`, [rv.rows?.[0]?.id, U.byu])).ok);
const gm = await as(U.ute, `insert into threads (room, title, user_id, is_game_thread) values ('game-401','BYU @ Utah',$1,true) returning id`, [U.ute]);
check('anyone can start the game-day thread', gm.ok, gm.err);
check('anyone can post in the game-day thread', (await as(U.byu, `insert into posts (thread_id, user_id, body) values ($1,$2,'TOUCHDOWN')`, [gm.rows?.[0]?.id, U.byu])).ok);
const bumped = await admin(`select last_post_at > created_at as b from threads where id = $1`, [rv.rows?.[0]?.id]);
check('thread moves to top after a reply', bumped.rows[0].b === true);
check('post like works', (await as(U.ute, `insert into post_reactions (post_id, user_id, kind) select id, $1, 'like' from posts limit 1`, [U.ute])).ok);

console.log('reports, auto-hide, blocks, moderation');
const tc = await as(U.troll, `insert into comments (item_id, team_id, user_id, body) values ('xyz','school-254',$1,'something nasty') returning id`, [U.troll]);
const cid = tc.rows?.[0]?.id;
check('troll comment posted', tc.ok);
check('report 1', (await as(U.ute, `insert into reports (target_type, target_id, reporter_id, reason) values ('comment',$1,$2,'harassment')`, [cid, U.ute])).ok);
check("can't report the same thing twice", !(await as(U.ute, `insert into reports (target_type, target_id, reporter_id, reason) values ('comment',$1,$2,'spam')`, [cid, U.ute])).ok);
check("can't file a report as someone else", !(await as(U.troll, `insert into reports (target_type, target_id, reporter_id, reason) values ('comment',$1,$2,'spam')`, [cid, U.byu])).ok);
await as(U.byu, `insert into reports (target_type, target_id, reporter_id, reason) values ('comment',$1,$2,'hate')`, [cid, U.byu]);
let vis = await as(null, `select count(*)::int n from comments where id = $1`, [cid]);
check('still visible after 2 reports', vis.rows[0].n === 1);
await as(U.mod, `insert into reports (target_type, target_id, reporter_id, reason) values ('comment',$1,$2,'harassment')`, [cid, U.mod]);
vis = await as(U.byu, `select count(*)::int n from comments where id = $1`, [cid]);
check('hidden from everyone after 3 reports', vis.rows[0].n === 0);
vis = await as(U.troll, `select count(*)::int n from comments where id = $1`, [cid]);
check('author still sees own hidden comment', vis.rows[0].n === 1);
check("regular users can't read reports", (await as(U.byu, `select count(*)::int n from reports`)).rows[0].n === 0);
check('moderator reads reports', (await as(U.mod, `select count(*)::int n from reports`)).rows[0].n === 3);
check('moderator sees hidden comment', (await as(U.mod, `select count(*)::int n from comments where id = $1`, [cid])).rows[0].n === 1);
check('moderator resolves reports', (await as(U.mod, `update reports set resolved = true where target_id = $1`, [cid])).ok);
check('moderator deletes the comment', (await as(U.mod, `delete from comments where id = $1 returning 1`, [cid])).rows?.length === 1);
check('BYU fan blocks the troll', (await as(U.byu, `insert into blocks (blocker_id, blocked_id) values ($1,$2)`, [U.byu, U.troll])).ok);
check("can't block yourself", !(await as(U.byu, `insert into blocks (blocker_id, blocked_id) values ($1,$1)`, [U.byu])).ok);
check('blocks are private', (await as(U.troll, `select count(*)::int n from blocks`)).rows[0].n === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

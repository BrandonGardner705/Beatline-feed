-- Diehard community: comments, likes, reactions, shares, chat boards, reports, blocks.
-- Run once in Supabase: SQL Editor -> New query -> paste all -> Run.

-- ---------- Profiles (one per signed-in user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  home_team text not null,                         -- e.g. college-football-252 (BYU)
  home_team_set_at timestamptz not null default now(),
  is_moderator boolean not null default false,
  created_at timestamptz not null default now()
);

-- Home team can only change once every 30 days; users can't make themselves moderators.
-- These limits apply to people using the app. You (in the Supabase dashboard / SQL editor,
-- where there is no app user) can still change anything, e.g. make someone a moderator.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.is_moderator <> old.is_moderator
     and not coalesce((select is_moderator from profiles where id = auth.uid()), false) then
    raise exception 'Not allowed';
  end if;
  if new.home_team <> old.home_team then
    if old.home_team_set_at > now() - interval '30 days' then
      raise exception 'You can switch home teams once every 30 days';
    end if;
    new.home_team_set_at := now();
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- New accounts: no commenting for the first 10 minutes (reactions still OK). Raise this once you launch publicly.
create or replace function public.can_post() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p
                 where p.id = auth.uid() and p.created_at < now() - interval '10 minutes');
$$;

create or replace function public.home_team_of(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select home_team from profiles where id = uid;
$$;

-- ---------- Feed items: likes / reactions / shares ----------
-- item_id = stable id of an article, video or player post from the feed (hash of its URL).
create table if not exists public.item_reactions (
  item_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('like','fire','laugh','mad','dead')),
  created_at timestamptz not null default now(),
  primary key (item_id, user_id, kind)
);
create index if not exists item_reactions_item on public.item_reactions(item_id);

create table if not exists public.item_shares (
  id bigserial primary key,
  item_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists item_shares_item on public.item_shares(item_id);

-- ---------- Comments on feed items ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  team_id text not null,                            -- team whose feed the item is in
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_item on public.comments(item_id, created_at);

-- ---------- Chat boards ----------
-- room: a team key like 'school-252' (team board) or 'school-252-game-<espn id>' (that team's
-- game-day thread). Only that team's fans can post; everyone can read.
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  sport text not null default 'football',
  title text not null check (char_length(title) between 3 and 120),
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_game_thread boolean not null default false,
  hidden boolean not null default false,
  last_post_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists threads_room on public.threads(room, last_post_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_thread on public.posts(thread_id, created_at);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('like','fire','laugh','mad','dead')),
  primary key (post_id, user_id, kind)
);

-- Who may post in a room: only their home team's board and their home team's game threads.
create or replace function public.can_post_in(room text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_post() and (
    room = public.home_team_of(auth.uid())
    or room like public.home_team_of(auth.uid()) || '-game-%'
  );
$$;

-- Bump thread activity on each reply.
create or replace function public.bump_thread() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update threads set last_post_at = new.created_at where id = new.thread_id;
  return new;
end $$;
drop trigger if exists posts_bump on public.posts;
create trigger posts_bump after insert on public.posts
  for each row execute function public.bump_thread();

-- Slow mode: accounts under 7 days old get one comment/post per 60 seconds.
create or replace function public.slow_mode() returns trigger
language plpgsql security definer set search_path = public as $$
declare young boolean; last_at timestamptz;
begin
  select created_at > now() - interval '7 days' into young from profiles where id = new.user_id;
  if young then
    select max(t) into last_at from (
      select max(created_at) t from comments where user_id = new.user_id
      union all select max(created_at) from posts where user_id = new.user_id
      union all select max(created_at) from threads where user_id = new.user_id) s;
    if last_at > now() - interval '60 seconds' then
      raise exception 'Slow down - new accounts can post once a minute';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists comments_slow on public.comments;
create trigger comments_slow before insert on public.comments for each row execute function public.slow_mode();
drop trigger if exists posts_slow on public.posts;
create trigger posts_slow before insert on public.posts for each row execute function public.slow_mode();
drop trigger if exists threads_slow on public.threads;
create trigger threads_slow before insert on public.threads for each row execute function public.slow_mode();

-- ---------- Reports & blocks ----------
create table if not exists public.reports (
  id bigserial primary key,
  target_type text not null check (target_type in ('comment','post','thread','user')),
  target_id text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','hate','off_topic','other')),
  note text check (char_length(note) <= 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)
);

-- 3 reports from different users auto-hides the content until a moderator reviews it.
create or replace function public.auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from reports
   where target_type = new.target_type and target_id = new.target_id and not resolved;
  if n >= 3 then
    if new.target_type = 'comment' then update comments set hidden = true where id = new.target_id::uuid;
    elsif new.target_type = 'post' then update posts set hidden = true where id = new.target_id::uuid;
    elsif new.target_type = 'thread' then update threads set hidden = true where id = new.target_id::uuid;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists reports_auto_hide on public.reports;
create trigger reports_auto_hide after insert on public.reports
  for each row execute function public.auto_hide();

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create or replace function public.is_mod() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from profiles where id = auth.uid()), false);
$$;

-- ---------- Row level security ----------
alter table public.profiles enable row level security;
alter table public.item_reactions enable row level security;
alter table public.item_shares enable row level security;
alter table public.comments enable row level security;
alter table public.threads enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- Profiles: public names/teams; you create and edit only your own.
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid() and is_moderator = false);
create policy "profiles update own" on public.profiles for update using (id = auth.uid() or public.is_mod());

-- Reactions & shares: everyone reads counts; signed-in users manage their own.
create policy "reactions read" on public.item_reactions for select using (true);
create policy "reactions add" on public.item_reactions for insert with check (user_id = auth.uid());
create policy "reactions remove" on public.item_reactions for delete using (user_id = auth.uid());
create policy "shares read" on public.item_shares for select using (true);
create policy "shares add" on public.item_shares for insert with check (user_id = auth.uid());
create policy "post reactions read" on public.post_reactions for select using (true);
create policy "post reactions add" on public.post_reactions for insert with check (user_id = auth.uid());
create policy "post reactions remove" on public.post_reactions for delete using (user_id = auth.uid());

-- Comments: hidden ones only visible to their author and moderators;
-- you can only comment in your home team's feeds (anyone can read).
create policy "comments read" on public.comments for select
  using (not hidden or user_id = auth.uid() or public.is_mod());
create policy "comments add" on public.comments for insert
  with check (user_id = auth.uid() and public.can_post() and team_id = public.home_team_of(auth.uid()));
create policy "comments delete own" on public.comments for delete using (user_id = auth.uid() or public.is_mod());
create policy "comments moderate" on public.comments for update using (public.is_mod());

-- Threads & posts
create policy "threads read" on public.threads for select
  using (not hidden or user_id = auth.uid() or public.is_mod());
create policy "threads add" on public.threads for insert
  with check (user_id = auth.uid() and public.can_post_in(room));
create policy "threads delete own" on public.threads for delete using (user_id = auth.uid() or public.is_mod());
create policy "threads moderate" on public.threads for update using (public.is_mod());

create policy "posts read" on public.posts for select
  using (not hidden or user_id = auth.uid() or public.is_mod());
create policy "posts add" on public.posts for insert
  with check (user_id = auth.uid()
    and public.can_post_in((select room from public.threads t where t.id = thread_id)));
create policy "posts delete own" on public.posts for delete using (user_id = auth.uid() or public.is_mod());
create policy "posts moderate" on public.posts for update using (public.is_mod());

-- Reports: you file your own; only moderators read and resolve them.
create policy "reports add" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports mod read" on public.reports for select using (public.is_mod());
create policy "reports mod resolve" on public.reports for update using (public.is_mod());

-- Blocks: private to the blocker.
create policy "blocks read own" on public.blocks for select using (blocker_id = auth.uid());
create policy "blocks add" on public.blocks for insert with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
create policy "blocks remove" on public.blocks for delete using (blocker_id = auth.uid());

-- Live updates for chat and comments.
alter publication supabase_realtime add table public.posts, public.comments, public.threads;

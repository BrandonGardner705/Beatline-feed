# Diehard app

The Diehard fan app (Expo / React Native). One codebase for iPhone, Android and the web version
served at `/app/` by the feed repo.

## Run it

```
npm install
npx expo start          # phone, with Expo Go
npx expo export --platform web   # web build in dist/
```

## Where things live

- `App.tsx` — app shell, tabs, team switcher, feed screen
- `src/feed.ts` — loads the feed from `FEED_URL` (`src/config.ts`)
- `src/onboarding.tsx` — welcome and team picker
- `src/components.tsx`, `src/post.tsx` — feed cards
- `src/shorts.tsx` — full-screen swipe video feed
- `src/gamecenter.tsx`, `src/screens.tsx`, `src/clips.tsx` — gameday hub, scoreboards, nav, search
- `src/standings.tsx`, `src/alerts.tsx`, `src/topics.ts`, `src/theme.ts`, `src/sports.ts`

## Community (comments, reactions, chat)

- `src/community.tsx` — sign-in sheets, fan profiles, the like/react/comment/share bar,
  comments, the Chat tab (team board, rivalry room, game-day thread), reporting, blocking,
  and the moderator review screen.
- `src/supabase.ts` — Supabase connection and sign-in (Google, Apple, email link).
- Database rules: `beatline-feed/supabase/schema.sql` (run once in Supabase → SQL Editor).
  Tests: `beatline-feed/supabase/rules.test.mjs`.
- Make someone a moderator in Supabase → SQL Editor:
  `update profiles set is_moderator = true where display_name = 'TheirName';`

## History

The original source was lost on Oct 22; this code was recovered from that day's compiled build on
Nov 4 and checked screen by screen against the live app. Files still marked `@ts-nocheck` have
short variable names from the recovery and are being cleaned up.

**Always commit source changes here.** Never ship only a compiled build.

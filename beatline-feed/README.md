# Beatline Feed

The engine behind the Beatline app. Every 20 minutes it reads every source for each team,
keeps what mentions the team, tags players from the live roster, and publishes JSON the app reads.

Runs free on GitHub (Actions + Pages). No server to manage.

## What it pulls

| Source | How | Cost |
|---|---|---|
| Record, conference, next game, roster | ESPN public team data | Free |
| News (KSL, Deseret News, Herald Journal, Tribune, Daily Herald, KUTV, On3, 247 and more) | Google News feeds, by team and by local outlet | Free |
| Podcasts and radio shows | Apple Podcasts lookup → each show's own feed | Free |
| YouTube highlights, pressers, shows | Each channel's video feed | Free |
| Official athletics sites | Their news feeds | Free |
| Any news outlet anywhere | Google News **and** Bing News, by team, plus targeted searches of local, national and fan sites | Free |
| Any podcast episode on any show that mentions the team (including national shows) | Apple Podcasts episode search | Free |
| Fan communities | Team subreddits and Reddit-wide search | Free |
| Any YouTube channel that posts about the team | YouTube search (optional free key) | Free |
| AI summaries + 30-second catch-up | Claude (optional) | About $1–5/month |
| Player social posts (X, Instagram, TikTok) | A feed service per account (see below) | Paid, optional |

## Setup (about 10 minutes)

1. Create a free account at github.com.
2. Click **New repository**, name it `beatline-feed`, set it to **Public**, and create it.
3. Click **uploading an existing file**, drag in everything from this folder (including the hidden `.github` folder), and commit.
   - On a Mac, press Cmd+Shift+. in Finder to see the `.github` folder.
4. Go to **Settings → Pages**. Under "Build and deployment", set Source to **GitHub Actions**.
5. Go to the **Actions** tab, click **Build feed**, then **Run workflow**.
6. When it finishes (about 2 minutes), your feed is live at
   `https://YOUR-USERNAME.github.io/beatline-feed/index.json`
7. Open `status.json` at the same address to see which sources loaded and which failed.
8. Open `leagues.json` at the same address to see every league and team.
9. Put that address in the app: `src/config.ts` → `FEED_URL`.

Optional, for AI summaries: get an API key at console.anthropic.com, then in GitHub go to
**Settings → Secrets and variables → Actions → New repository secret**, name it `ANTHROPIC_API_KEY`.
Without it, the app uses each source's own description and top headlines.

Optional, for YouTube search across every channel: in Google Cloud Console, create a project, enable **YouTube Data API v3**, create an API key, and add it as a secret named `YOUTUBE_API_KEY`. It's free, and the builder searches each team every 3 hours to stay inside the free limit.

## How it scales to every team

- **Leagues** live in `config/leagues.json` (NFL, NBA, MLB, NHL, MLS, college football and basketball, Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Liga MX to start). To add a league, add one line with its ESPN code.
- **Every team gets an automatic recipe.** Once a week the builder pulls each league's full team list from ESPN and writes a recipe per team: news searches in the team's country and language, auto-found podcasts, and filters that keep rival teams out (Utah never picks up Utah State stories).
- **Any team can have a custom recipe** in `config/teams/<team-id>.json`. Custom sources add to the automatic ones, and custom match rules replace them. BYU, Utah, Utah State and the Jazz already have one. The team id is the league id plus the ESPN team number, for example `college-football-328`.
- **Every team has its own refresh time** (`every`, in minutes). Big teams can refresh every 20 minutes and the long tail every hour or few hours. Each run builds the featured teams first, then whoever is most overdue, and stops before GitHub's time limit. Anything not finished goes first next run.
- **The app gets a directory:** `leagues.json` plus one file per league, so fans can browse and search every team.

## Adding a source to a team

Edit (or create) `config/teams/<team-id>.json` and commit. Examples:

- Podcast with an Apple link: copy the number after `id` in the link → `{ "appleId": 123, "name": "Show name" }`
- Podcast by name: `{ "search": "Show name", "name": "Show name" }`
- YouTube: `{ "name": "Channel", "handle": "@handle" }` or `{ "channelId": "UC..." }`. Add `"teamOnly": true` if every video is about the team.
- Any site with an RSS feed: add to `rss`.
- Faster or slower refresh: `"every": 20`

Channels marked `"verify": true` are best guesses. After a run, check `status.json` and swap in the right handle if one failed.

## When to move off GitHub

GitHub's free tier comfortably handles a few hundred teams on fast refresh plus thousands on slower refresh.
Past that, the same scripts move to a small paid host (Cloudflare Workers or a $5–10/month server) that runs many teams in parallel.
Google News can also start limiting requests at very high volume. At that point, a paid news API is the upgrade.

## Player social posts

X, Instagram and TikTok don't offer free access to posts. To include an athlete's posts:

1. Make a feed for their account with a service such as RSS.app (paid) or a self-hosted RSSHub (free, more setup).
2. Add it to the team's `social` list:
   `{ "player": "Full Name", "platform": "Instagram", "profile": "https://instagram.com/handle", "rss": "https://…" }`

Without `rss`, the player page still shows a button that opens their profile.
Posts show up in the feed and on that player's page automatically.

## Rules the feed follows

- Shows headlines, short summaries, thumbnails and links. Never copies full articles or re-hosts audio or video.
- Every item links to the original outlet.

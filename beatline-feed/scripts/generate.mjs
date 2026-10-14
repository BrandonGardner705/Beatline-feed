// Writes an automatic recipe for every team in every league to cache/generated/<league>.json.
// Run by itself with `npm run generate`; the build also runs it when the lists are a week old.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { recipeFromEspn } from './lib.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const GENERATED = path.join(ROOT, 'cache', 'generated');

export async function generateLeague(league, fetchImpl = fetch) {
  const q = league.query ? `&${league.query}` : '';
  const url = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/teams?limit=1000${q}`;
  const res = await fetchImpl(url, { headers: { 'user-agent': 'BeatlineFeed/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const teams = (j.sports?.[0]?.leagues?.[0]?.teams || []).map((x) => x.team).filter(Boolean);
  return teams.map((t) => recipeFromEspn(t, league, teams));
}

export async function generateAll({ fetchImpl = fetch, maxAgeDays = 7, force = false } = {}) {
  const config = JSON.parse(await readFile(path.join(ROOT, 'config/leagues.json'), 'utf8'));
  await mkdir(GENERATED, { recursive: true });
  const report = [];
  for (const league of config.leagues) {
    const file = path.join(GENERATED, `${league.id}.json`);
    try {
      const s = await stat(file);
      if (!force && Date.now() - s.mtimeMs < maxAgeDays * 864e5) {
        report.push({ league: league.id, skipped: true });
        continue;
      }
    } catch {}
    try {
      const recipes = await generateLeague(league, fetchImpl);
      await writeFile(file, JSON.stringify(recipes, null, 1));
      report.push({ league: league.id, teams: recipes.length });
      console.log(`  ${league.name}: ${recipes.length} teams`);
    } catch (e) {
      report.push({ league: league.id, error: e.message });
      console.warn(`  ${league.name}: could not load team list (${e.message})`);
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  generateAll({ force: process.argv.includes('--force') }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

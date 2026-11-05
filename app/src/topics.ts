// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import * as t from './sports';
export const topicCounts = function(t) {
    const a = {};
    for (const s of t){
        for (const t of topicsOf(s)){
            a[t] = (a[t] || 0) + 1;
        }
    }
    return TOPICS.filter((t)=>a[t.id]).map((t)=>({
            ...t,
            count: a[t.id]
        }));
};
export const trending = function(t, s, a = Date.now()) {
    const r = new Set(`${t.team.name} ${t.team.short} ${t.team.city}`.toLowerCase().split(/\W+/).filter(Boolean));
    const o = Math.max(1, ...t.players.map((t)=>t.mentions || 0));
    const i = new Map(t.players.map((t)=>[
            t.name,
            (t.mentions || 0) / o
        ]));
    const n = s;
    const c = n.map((t)=>l(t, r));
    const b = (t, s)=>{
        if (Math.abs(n[t].at - n[s].at) > 172800000) {
            return false;
        }
        let a = 0;
        for (const r of c[t]){
            if (c[s].has(r)) {
                a++;
            }
        }
        const r = n[t].players.some((t)=>n[s].players.includes(t));
        return a >= 3 || a >= 2 && r;
    };
    const h = n.map((t, s)=>s);
    const f = (t)=>{
        if (h[t] === t) {
            return t;
        }
        return h[t] = f(h[t]);
    };
    for(let t = 0; t < n.length; t++){
        for(let s = t + 1; s < n.length; s++){
            if (b(t, s)) {
                h[f(t)] = f(s);
            }
        }
    }
    const u = new Map;
    n.forEach((t, s)=>{
        const a = f(s);
        u.set(a, [
            ...u.get(a) || [],
            s
        ]);
    });
    const p = [];
    for (const t of u.values()){
        const coverage = new Set(t.map((t)=>n[t].show ?? n[t].source)).size;
        const r = t.map((r)=>{
            const item = n[r];
            const l = Math.max(0, (a - item.at) / 3600000);
            const c = item.players.reduce((acc, player)=>acc + (i.get(player) || 0), 0);
            const b = item.image ? 0.25 : 0;
            const h = 0.15 * t.filter((t)=>n[t].by === 'fan').length;
            const f = Math.min(0.35 * Math.log10((item.replies || 0) + 1), 1);
            return {
                item,
                score: (1 + 1.1 * (coverage - 1) + 0.8 * Math.min(c, 1.5) + b + h + f) / (1 + l / 16) ** 1.25,
                coverage
            };
        }).sort((t, s)=>s.score - t.score || Number(!!s.item.image) - Number(!!t.item.image));
        p.push(r[0]);
    }
    return p.sort((t, s)=>s.score - t.score);
};
export const isOwnPost = function(t, s) {
    if (!s || t.kind !== 'social' || t.by !== 'player') {
        return false;
    }
    const a = new Set(s.socials.map((t)=>String(t.handle || '').toLowerCase()));
    if (t.handle) {
        return a.has(t.handle.toLowerCase());
    }
    return t.players[0] === s.name;
};
export const TOPICS = [
    {
        id: 'games',
        label: 'Games & recaps',
        re: /\b(recap|takeaways|grades?|win over|wins?|loss to|falls? to|beats?|defeats?|rall(y|ies)|upset|overtime|final score|postgame|halftime|victory|blowout|routs?|comeback)\b/i
    },
    {
        id: 'preview',
        label: 'Previews',
        re: /\b(preview|predictions?|picks?|how to watch|keys to|matchup|what to watch|game ?day|scouting report|storylines|things to know|vs\.?)\b/i
    },
    {
        id: 'recruiting',
        label: 'Recruiting',
        re: /\b(recruit\w*|commit\w*|decommit\w*|offers?|offered|official visit|signees?|signing day|class of 20\d\d|prospects?|\d-star|flips?|flipped)\b/i
    },
    {
        id: 'portal',
        label: 'Transfer portal',
        re: /\b(transfers?|transferring|portal)\b/i
    },
    {
        id: 'injuries',
        label: 'Injuries',
        re: /\b(injur\w*|out for|questionable|doubtful|surgery|sidelined|returns? from|day-to-day|carted|health update)\b/i
    },
    {
        id: 'coaching',
        label: 'Coaching & staff',
        re: /\b(hire[sd]?|hiring|fired|coordinators?|extension|contract|buyout|coaching (staff|search|change)|interim|staff)\b/i
    },
    {
        id: 'interviews',
        label: 'Interviews',
        re: /\b(press conference|presser|interview|media day|talks?|speaks?|reacts?|mic'?d up|coach'?s show|weekly show|says|said|q&a)\b/i
    },
    {
        id: 'rankings',
        label: 'Rankings & postseason',
        re: /\b(rank\w*|polls?|top 25|cfp|playoff|power rankings?|bowl|projections?)\b/i
    },
    {
        id: 'roster',
        label: 'Depth chart',
        re: /\b(depth chart|roster|starters?|starting|redshirt|lineup|qb battle|quarterback battle|snap counts?|pff)\b/i
    },
    {
        id: 'conference',
        label: 'Conference',
        re: /\b(big 12|pac-?12|mountain west|conference|realignment|expansion|big ten|sec|acc)\b/i
    },
    {
        id: 'money',
        label: 'NIL & money',
        re: /\b(nil|collectives?|donations?|donors?|revenue|stadium|facilit(y|ies)|budget|million|fundrais\w*|invest\w*)\b/i
    },
    {
        id: 'schedule',
        label: 'Schedule & TV',
        re: /\b(schedule|tickets?|kickoff time|tv|broadcast|homecoming|sold out|streaming|where to watch)\b/i
    },
    {
        id: 'other',
        label: 'Other sports',
        re: /$^/
    }
];
const a = {
    football: 'football|gridiron',
    basketball: 'basketball|hoops',
    rest: 'volleyball|soccer|softball|baseball|gymnastics|track and field|swim\\w*|golf|tennis|wrestling|cross country'
};
const r = (t)=>new RegExp(`\\b(${Object.entries(a).filter(([s])=>s !== t).map(([, t])=>t).join('|')})\\b`, 'i');
const o = new Map;
export function topicsOf(a, i = t.sportOf(a.team || '')) {
    const n = `${i}:${a.id}`;
    const l = o.get(n);
    if (l) {
        return l;
    }
    const c = `${a.title} ${a.summary ?? ''}`;
    const b = r(i);
    const h = TOPICS.filter((t)=>(t.id === 'other' ? b : t.re).test(c)).map((t)=>t.id);
    o.set(n, h);
    return h;
}
const n = new Set('about after again against also back been before being best could does down even from game games have here into just know last like look looks made make more most much need news next only over really said says season should some still than that their them then there these they this those three time today very week what when where which while will with would year your football basketball utah state aggies cougars utes byu brigham young university college sports video podcast episode show live watch'.split(' '));
function l(t, s) {
    return new Set(t.title.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).map((t)=>t.replace(/'s$/, '').replace(/'/g, '')).filter((t)=>t.length >= 4 && !n.has(t) && !s.has(t)));
}

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import t from 'react';
import s from '@react-native-async-storage/async-storage';
import * as o from './config';
import * as i from './snapshot';
import * as n from './data';
import * as l from './sports';
import * as c from './theme';
export const useFeed = function() {
    const [e, setE] = t.useState(m ? [] : n.SAMPLE_TEAM_LIST);
    const [o, setO] = t.useState(m ? [] : n.SAMPLE_TEAM_LIST);
    const [ready, setReady] = t.useState(false);
    const [E, setE_1] = t.useState('');
    const [w, setW] = t.useState(l.SPORTS[0].id);
    const [M, setM] = t.useState(m ? {} : n.SAMPLE);
    const [leagues, setLeagues] = t.useState(m ? [] : n.SAMPLE_LEAGUES.map((e)=>({
            id: e.id,
            name: e.name,
            teams: e.teams.length
        })));
    const [T, setT] = t.useState(m ? {} : Object.fromEntries(n.SAMPLE_LEAGUES.map((e)=>[
            e.id,
            e.teams
        ])));
    const [refreshing, setRefreshing] = t.useState(false);
    const [offline, setOffline] = t.useState(false);
    const F = (e)=>{
        setE(e);
        a.default.setItem(p, JSON.stringify(e)).catch(()=>{});
    };
    const K = t.useCallback(async (e, t = false)=>{
        if (m && e) {
            if (!t) {
                setRefreshing(true);
            }
            try {
                const t = h(await y(`/teams/${e}.json`), e);
                setM((s)=>{
                    const o = {
                        ...s,
                        [e]: t
                    };
                    a.default.setItem(S, JSON.stringify(o)).catch(()=>{});
                    return o;
                });
                setOffline(false);
            } catch  {
                if (!t) {
                    setOffline(true);
                }
            } finally{
                if (!t) {
                    setRefreshing(false);
                }
            }
        }
    }, []);
    const loadAll = t.useCallback((e)=>{
        e.forEach((e, t)=>setTimeout(()=>K(e, true), 400 * (t + 1)));
    }, [
        K
    ]);
    const loadLeague = t.useCallback(async (e)=>{
        if (m && !T[e]) {
            try {
                const t = await y(`/leagues/${e}.json`);
                setT((s)=>({
                        ...s,
                        [e]: (t.teams ?? []).map(f)
                    }));
            } catch  {}
        }
    }, [
        T
    ]);
    t.useEffect(()=>{
        (async ()=>{
            const [[, t], [, o], [, n]] = await a.default.multiGet([
                p,
                S,
                'bl.active'
            ]).catch(()=>[
                    [
                        0,
                        null
                    ],
                    [
                        0,
                        null
                    ],
                    [
                        0,
                        null
                    ]
                ]);
            let c = (t ? JSON.parse(t) : e).map(f);
            let h = [];
            if (m && o) {
                setM(Object.fromEntries(Object.entries(JSON.parse(o)).map(([e, t])=>[
                        e,
                        {
                            ...t,
                            team: f(t.team)
                        }
                    ])));
            }
            if (m) {
                try {
                    const e = await y('/leagues.json');
                    setLeagues(e.leagues ?? []);
                    h = (e.featured ?? []).map(f);
                    setO(h);
                    setOffline(false);
                } catch  {
                    setOffline(true);
                }
            }
            const b = await a.default.getItem('bl.sportsPicked').catch(()=>null) ? c : l.withSiblings(c, h);
            if (b.length !== c.length) {
                c = b;
                a.default.setItem(p, JSON.stringify(c)).catch(()=>{});
            }
            setE(c);
            setReady(true);
            const E = n && c.some((e)=>e.id === n) ? n : c[0]?.id ?? '';
            if (E) {
                setW(l.sportOf(E));
            }
            setE_1(E);
            if (E) {
                $(E, c).forEach((e)=>K(e.id, e.id !== E));
            }
        })();
    }, []);
    const $ = (t, s = e)=>{
        const a = s.find((e)=>e.id === t);
        if (!a) {
            return [];
        }
        const o = (e)=>l.SPORTS.findIndex((t)=>t.id === l.sportOf(e.id));
        return s.filter((e)=>l.schoolKey(e) === l.schoolKey(a)).sort((e, t)=>o(e) - o(t));
    };
    const setActive = (t, s = e)=>{
        setE_1(t);
        if (t) {
            setW(l.sportOf(t));
        }
        a.default.setItem('bl.active', t).catch(()=>{});
        if (m) {
            for (const e of $(t, s)){
                if (!(M[e.id] && e.id !== t)) {
                    K(e.id, e.id !== t);
                }
            }
        }
    };
    const inSport = e.filter((e)=>l.sportOf(e.id) === w);
    const sports = l.SPORTS.filter((t)=>e.some((e)=>l.sportOf(e.id) === t.id) || o.some((e)=>l.sportOf(e.id) === t.id));
    const schools = e.filter((t, s)=>e.findIndex((e)=>l.schoolKey(e) === l.schoolKey(t)) === s);
    const D = $(E).map((e)=>e.id);
    const sportFeeds = D.map((e)=>M[e]).filter(Boolean);
    const feed = t.useMemo(()=>mergeFeeds(sportFeeds), [
        D.join(','),
        M
    ]);
    return {
        schools,
        sportFeeds,
        sport: w,
        setSport: (t)=>{
            const s = e.filter((e)=>l.sportOf(e.id) === t);
            const a = e.find((e)=>e.id === E);
            const o = a && s.find((e)=>l.schoolKey(e) === l.schoolKey(a)) || s[0];
            setW(t);
            if (o) {
                setActive(o.id);
            }
        },
        sports,
        inSport,
        feeds: M,
        loadAll,
        followed: e,
        active: E,
        setActive,
        follow: (t)=>{
            if (!e.some((e)=>e.id === t.id)) {
                F([
                    ...e,
                    t
                ]);
                setActive(t.id);
            }
        },
        unfollow: (t)=>{
            const s = e.filter((e)=>e.id !== t);
            F(s);
            if (E === t && s[0]) {
                setActive(s[0].id);
            }
        },
        setFollowedList: (e)=>{
            const t = e;
            a.default.setItem('bl.sportsPicked', '1').catch(()=>{});
            F(t);
            const s = t.some((e)=>e.id === E) ? E : t[0]?.id ?? '';
            if (s) {
                setActive(s, t);
            } else {
                setE_1('');
            }
        },
        featured: o,
        ready,
        feed,
        leagues,
        leagueTeams: T,
        loadLeague,
        refresh: ()=>{
            D.forEach((e)=>K(e, e !== E));
        },
        refreshing,
        offline,
        live: m,
        configured: m
    };
};
let e;
var a = (e = s) && e.__esModule ? e : {
    default: e
};
const f = (e)=>{
    if (e) {
        return {
            ...e,
            color: c.officialColor(e.id, e.color)
        };
    }
    return e;
};
const u = ()=>o.FEED_URL.replace(/\/$/, '');
const m = !!o.FEED_URL || !!i.SNAPSHOT;
const p = m ? 'bl.followed.live' : 'bl.followed.sample';
const S = 'bl.feedcache.v2';
function h(e, team) {
    return {
        team: f({
            ...e.team,
            id: e.team?.id ?? team,
            mode: e.team?.mode ?? 'tuned'
        }),
        brief: e.brief ?? [],
        players: (e.players ?? []).map((e)=>({
                socials: [],
                mentions: 0,
                pos: '',
                ...e
            })),
        standings: e.standings ?? null,
        boards: e.boards ?? [],
        polls: e.polls ?? [],
        items: (e.items ?? []).map((e)=>({
                ...e,
                team,
                players: e.players ?? []
            })),
        sources: e.sources ?? 0,
        updatedAt: e.updatedAt ?? Date.now()
    };
}
async function y(e) {
    if (i.SNAPSHOT) {
        if (!i.SNAPSHOT[e]) {
            throw new Error('404');
        }
        return i.SNAPSHOT[e];
    }
    const t = await fetch(`${u()}${e}`, {
        cache: 'no-store'
    });
    if (!t.ok) {
        throw new Error(String(t.status));
    }
    return t.json();
}
export function mergeFeeds(e) {
    if (!e.length) {
        return;
    }
    const [t] = e;
    if (e.length === 1) {
        return {
            ...t,
            team: {
                ...t.team,
                name: l.schoolName(t.team.name)
            }
        };
    }
    const s = new Set;
    const items = [
        ...e
    ].reverse().flatMap((e)=>e.items).sort((e, t)=>t.at - e.at).filter((e)=>{
        const t = e.url || e.id;
        return !s.has(t) && !s.has(e.id) && (s.add(t), s.add(e.id), true);
    });
    const o = new Map;
    for (const t of e){
        for (const e of t.players){
            const t = o.get(e.name);
            o.set(e.name, t ? {
                ...t,
                mentions: (t.mentions || 0) + (e.mentions || 0)
            } : e);
        }
    }
    const boards = e.flatMap((e)=>e.boards ?? []).filter((e, t, s)=>s.findIndex((t)=>t.url === e.url) === t);
    return {
        ...t,
        team: {
            ...t.team,
            name: l.schoolName(t.team.name)
        },
        brief: e.flatMap((e)=>e.brief),
        players: [
            ...o.values()
        ].sort((e, t)=>(t.mentions || 0) - (e.mentions || 0)),
        boards,
        items,
        sources: e.reduce((acc, item)=>acc + (item.sources || 0), 0),
        updatedAt: Math.max(...e.map((e)=>e.updatedAt || 0))
    };
}

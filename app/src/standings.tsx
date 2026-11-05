// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Pressable as O, StyleSheet as n, Text as L, View as R } from 'react-native';
import t from 'react';




import * as i from '@expo/vector-icons';
import * as s from './theme';
import * as c from './components';

export const StandingsPanel = function({ st, team, c: c_1 }) {
    const p = String(team.id).match(/(\d+)$/)?.[1] ?? '';
    const [x, setX] = t.useState({});
    const j = t.useMemo(()=>scenario(st, p, x), [
        st,
        p,
        x
    ]);
    const team_color = team.color;
    const w = c.accentFor(team_color, c_1, 0.5);
    const S = (e)=>setX((t)=>({
                ...t,
                [e]: t[e] === undefined ? 'W' : t[e] === 'W' ? 'L' : undefined
            }));
    const k = st.name.replace(/ Conference$/, '');
    const T = st.rows.every((e)=>e.confW + e.confL === 0);
    const $ = [];
    if (j) {
        const t = j.open ? `${j.ourMin}\u2013${j.ourMax} conference wins possible` : `finishes ${j.finalW}-${j.finalL} in the ${k}`;
        $.push({
            icon: 'calculator-outline',
            text: `${team.short} ${t}.`
        });
        if (j.worst !== 1 || j.level.length) {
            if (j.worst === 1) {
                $.push({
                    icon: 'trophy-outline',
                    text: `Clinches at least a share of 1st. ${j.level.map((e)=>e.short).join(', ')} could tie.`,
                    tone: 'good'
                });
            } else {
                $.push({
                    icon: 'podium-outline',
                    text: `Best finish: ${h(j.best)}. Worst: ${h(j.worst)}${j.level.length ? ` (${h(j.worstWithTies)} if ties break the wrong way)` : ''}.`
                });
            }
        } else {
            $.push({
                icon: 'trophy-outline',
                text: `Clinches the ${k} regular-season title outright.`,
                tone: 'good'
            });
        }
        if (st.titleGame) {
            if (j.worstWithTies <= 2) {
                $.push({
                    icon: 'checkmark-circle',
                    text: `Locks up a spot in the ${k} title game.`,
                    tone: 'good'
                });
            } else if (j.worst <= 2) {
                $.push({
                    icon: 'git-branch-outline',
                    text: `In the ${k} title game unless a tiebreaker goes against them.`
                });
            } else if (j.best <= 2) {
                $.push({
                    icon: 'help-circle-outline',
                    text: "Still alive for the title game, but needs help."
                });
            } else {
                $.push({
                    icon: 'close-circle',
                    text: `Out of the ${k} title game race.`,
                    tone: 'bad'
                });
            }
        }
        if (j.ahead.length && j.worst > 1) {
            $.push({
                icon: 'people-outline',
                text: `Can still finish ahead: ${j.ahead.slice(0, 6).map((e)=>e.short).join(', ')}${j.ahead.length > 6 ? ` +${j.ahead.length - 6}` : ''}.`
            });
        }
    }
    return <R style={{
        gap: 12,
        marginTop: 12
    }}><R style={[
        m.card,
        {
            backgroundColor: c_1.surface,
            borderColor: c_1.line
        }
    ]}><R style={m.headRow}><L style={[
        m.title,
        {
            color: c_1.fg
        }
    ]}>{st.name}</L><L style={[
        m.mono,
        {
            color: c_1.muted
        }
    ]}>CONF · ALL</L></R>{st.rows.map((e, t)=>{
        const o = e.id === p;
        return <R key={e.id} style={[
            m.row,
            {
                borderTopColor: c_1.line
            },
            o && {
                backgroundColor: s.alpha(team_color, c_1.dark ? 0.28 : 0.1)
            }
        ]}><L style={[
            m.rank,
            {
                color: c_1.muted
            }
        ]}>{t + 1}</L><L style={[
            m.team,
            {
                color: c_1.fg,
                fontFamily: o ? s.fonts.bodyBold : s.fonts.bodySemi
            }
        ]} numberOfLines={1}>{e.name}</L>{e.streak ? <L style={[
            m.mono,
            {
                color: c_1.muted,
                width: 34,
                textAlign: 'right'
            }
        ]}>{e.streak}</L> : null}<L style={[
            m.rec,
            {
                color: c_1.fg
            }
        ]}>{e.conf}</L><L style={[
            m.rec,
            {
                color: c_1.muted
            }
        ]}>{e.overall}</L></R>;
    })}<L style={[
        m.fine,
        {
            color: c_1.muted
        }
    ]}>Conference record first. Order from ESPN.</L></R>{st.remaining.length ? <R style={[
        m.card,
        {
            backgroundColor: c_1.surface,
            borderColor: c_1.line
        }
    ]}><R style={m.headRow}><L style={[
        m.title,
        {
            color: c_1.fg
        }
    ]}>What happens if…</L><R style={{
        flexDirection: 'row',
        gap: 6
    }}><O onPress={()=>{
        t = 'W';
        return setX(Object.fromEntries(st.remaining.map((e, o)=>[
                `${o}`,
                t
            ])));
        var t;
    }} style={[
        m.mini,
        {
            backgroundColor: c_1.surface2
        }
    ]}><L style={[
        m.miniText,
        {
            color: c_1.fg
        }
    ]}>Win out</L></O><O onPress={()=>setX({})} style={[
        m.mini,
        {
            backgroundColor: c_1.surface2
        }
    ]}><L style={[
        m.miniText,
        {
            color: c_1.fg
        }
    ]}>Reset</L></O></R></R><L style={[
        m.sub,
        {
            color: c_1.muted
        }
    ]}>Tap each {T ? 'conference ' : 'remaining conference '}game to pick a win or a loss.</L><R style={{
        gap: 8,
        marginTop: 10
    }}>{st.remaining.map((e, t)=>{
        const n = x[`${t}`];
        return <O key={`${e.opp}${e.date}`} onPress={()=>S(t)} accessibilityLabel={`${e.home ? 'vs' : 'at'} ${e.oppName}: ${n === 'W' ? 'win' : n === 'L' ? 'loss' : 'not picked'}`} style={[
            m.game,
            {
                borderColor: c_1.line
            }
        ]}><L style={[
            m.date,
            {
                color: c_1.muted
            }
        ]}>{new Date(e.date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        })}</L><L style={[
            m.opp,
            {
                color: c_1.fg
            }
        ]} numberOfLines={1}>{e.home ? 'vs' : 'at'} {e.oppName}</L><R style={[
            m.pick,
            {
                backgroundColor: n === 'W' ? s.STATUS.win : n === 'L' ? s.STATUS.loss : c_1.surface2
            }
        ]}><L style={[
            m.pickText,
            {
                color: n ? '#fff' : c_1.muted
            }
        ]}>{n ?? '–'}</L></R></O>;
    })}</R><R style={[
        m.result,
        {
            backgroundColor: s.alpha(team_color, c_1.dark ? 0.2 : 0.07)
        }
    ]}>{$.map((e)=><R key={e.text} style={m.line}><i.Ionicons name={e.icon} size={16} color={e.tone === 'good' ? s.STATUS.win : e.tone === 'bad' ? s.STATUS.loss : w}/><L style={[
            m.lineText,
            {
                color: c_1.fg
            }
        ]}>{e.text}</L></R>)}</R><L style={[
        m.fine,
        {
            color: c_1.muted
        }
    ]}>Counts conference wins only. Head-to-head and other tiebreakers can change ties.</L></R> : null}{st.watch.length ? <R style={[
        m.card,
        {
            backgroundColor: c_1.surface,
            borderColor: c_1.line
        }
    ]}><L style={[
        m.title,
        {
            color: c_1.fg
        }
    ]}>Games to watch</L><L style={[
        m.sub,
        {
            color: c_1.muted
        }
    ]}>Teams that can still catch {team.short}, playing each other.</L>{st.watch.map((e)=><R key={`${e.away}${e.home}${e.date}`} style={[
            m.row,
            {
                borderTopColor: c_1.line
            }
        ]}><L style={[
            m.date,
            {
                color: c_1.muted
            }
        ]}>{new Date(e.date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        })}</L><L style={[
            m.team,
            {
                color: c_1.fg
            }
        ]}>{e.away} at {e.home}</L></R>)}</R> : null}</R>;
};
export const PollsCard = function({ polls, team, c }) {
    const [u, setU] = t.useState(0);
    const [g, setG] = t.useState(false);
    const x = String(team.id).match(/(\d+)$/)?.[1] ?? '';
    const y = polls[Math.min(u, polls.length - 1)];
    if (!y) {
        return null;
    }
    const team_color = team.color;
    const b = g ? y.ranks : y.ranks.slice(0, 10);
    const w = y.ours && y.ours.rank > 10 && !g;
    const S = (e)=>{
        if (e.prev && e.prev !== e.rank) {
            return e.prev - e.rank;
        }
        return 0;
    };
    const k = y.ours ? `${team.short} is No. ${y.ours.rank}${y.ours.prev && y.ours.prev !== y.ours.rank ? ` (${y.ours.prev > y.ours.rank ? 'up' : 'down'} from ${y.ours.prev})` : y.ours.prev ? ' (no change)' : ''}` : y.receivingVotes ? `${team.short} is unranked, receiving ${y.receivingVotes} votes` : `${team.short} is unranked`;
    return <R style={[
        m.card,
        {
            backgroundColor: c.surface,
            borderColor: c.line
        }
    ]}><R style={m.headRow}><L style={[
        m.title,
        {
            color: c.fg
        }
    ]}>Top 25</L>{polls.length > 1 ? <R style={{
        flexDirection: 'row',
        gap: 6
    }}>{polls.map((e, t)=><O key={e.name} onPress={()=>setU(t)} style={[
            m.mini,
            {
                backgroundColor: t === u ? c.fg : c.surface2
            }
        ]}><L style={[
            m.miniText,
            {
                color: t === u ? c.bg : c.fg
            }
        ]}>{/playoff|cfp/i.test(e.name) ? 'CFP' : /coach/i.test(e.name) ? 'Coaches' : 'AP'}</L></O>)}</R> : <L style={[
        m.mono,
        {
            color: c.muted
        }
    ]}>{y.short}</L>}</R><R style={[
        m.result,
        {
            backgroundColor: s.alpha(team_color, c.dark ? 0.2 : 0.07),
            marginTop: 4,
            marginBottom: 8
        }
    ]}><L style={[
        m.lineText,
        {
            color: c.fg,
            fontFamily: s.fonts.bodySemi
        }
    ]}>{k} in the {y.name}.</L></R>{[
        ...b,
        ...w ? y.ranks.filter((e)=>e.id === x) : []
    ].map((e)=>{
        const t = e.id === x;
        const o = S(e);
        return <R key={e.id} style={[
            m.row,
            {
                borderTopColor: c.line
            },
            t && {
                backgroundColor: s.alpha(team_color, c.dark ? 0.28 : 0.1)
            }
        ]}><L style={[
            m.rank,
            {
                color: c.fg,
                width: 22,
                fontFamily: s.fonts.monoBold
            }
        ]}>{e.rank}</L><L style={[
            m.team,
            {
                color: c.fg,
                fontFamily: t ? s.fonts.bodyBold : s.fonts.bodySemi
            }
        ]} numberOfLines={1}>{e.name}</L>{o ? <R style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            width: 34,
            justifyContent: 'flex-end'
        }}><i.Ionicons name={o > 0 ? 'caret-up' : 'caret-down'} size={11} color={o > 0 ? s.STATUS.win : s.STATUS.loss}/><L style={[
            m.mono,
            {
                color: o > 0 ? s.STATUS.win : s.STATUS.loss
            }
        ]}>{Math.abs(o)}</L></R> : <L style={[
            m.mono,
            {
                color: c.muted,
                width: 34,
                textAlign: 'right'
            }
        ]}>–</L>}<L style={[
            m.rec,
            {
                color: c.muted
            }
        ]}>{e.record ?? ''}</L></R>;
    })}<O onPress={()=>setG((e)=>!e)} style={{
        paddingTop: 10
    }} hitSlop={8}><L style={[
        m.miniText,
        {
            color: c.fg
        }
    ]}>{g ? 'Show top 10' : 'Show all 25'}</L></O></R>;
};
export function scenario(e, t, o) {
    const us = e.rows.find((e)=>e.id === t);
    if (!us) {
        return null;
    }
    let l = 0;
    let r = 0;
    let open = 0;
    const s = new Set;
    const c = new Set;
    e.remaining.forEach((e, t)=>{
        const n = o[`${t}`];
        switch(n){
            case 'W':
                l++;
                s.add(e.opp);
                break;
            case 'L':
                r++;
                c.add(e.opp);
                break;
            default:
                open++;
        }
    });
    const ourMin = us.confW + l;
    const ourMax = ourMin + open;
    const h = e.rows.filter((e)=>e.id !== t).map((e)=>({
            ...e,
            minW: e.confW + (c.has(e.id) ? 1 : 0),
            maxW: e.maxW - (s.has(e.id) ? 1 : 0)
        }));
    const ahead = h.filter((e)=>e.maxW > ourMin);
    const level = h.filter((e)=>e.maxW === ourMin);
    const worst = 1 + ahead.length;
    const best = 1 + h.filter((e)=>e.minW > ourMax).length;
    const finalW = open ? null : ourMin;
    const finalL = open ? null : us.confL + r + (e.remaining.length - l - r - open);
    return {
        us,
        ourMin,
        ourMax,
        open,
        worst,
        worstWithTies: worst + level.length,
        best,
        ahead,
        level,
        finalW,
        finalL
    };
}
const h = (e)=>`${e}${e % 10 == 1 && e % 100 != 11 ? 'st' : e % 10 == 2 && e % 100 != 12 ? 'nd' : e % 10 == 3 && e % 100 != 13 ? 'rd' : 'th'}`;
const m = n.create({
    card: {
        borderRadius: 18,
        borderWidth: n.hairlineWidth,
        padding: 14
    },
    headRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 8
    },
    title: {
        fontFamily: s.fonts.display,
        fontSize: 17,
        letterSpacing: -0.3,
        flexShrink: 1
    },
    sub: {
        fontFamily: s.fonts.body,
        fontSize: 13,
        lineHeight: 18
    },
    mono: {
        fontFamily: s.fonts.mono,
        fontSize: 11
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        paddingHorizontal: 6,
        borderTopWidth: n.hairlineWidth,
        borderRadius: 8
    },
    rank: {
        fontFamily: s.fonts.mono,
        fontSize: 12,
        width: 18
    },
    team: {
        flex: 1,
        fontSize: 14
    },
    rec: {
        fontFamily: s.fonts.monoBold,
        fontSize: 12.5,
        width: 40,
        textAlign: 'right'
    },
    fine: {
        fontFamily: s.fonts.body,
        fontSize: 11.5,
        marginTop: 10
    },
    mini: {
        paddingHorizontal: 10,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center'
    },
    miniText: {
        fontFamily: s.fonts.bodySemi,
        fontSize: 12.5
    },
    game: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: n.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46
    },
    date: {
        fontFamily: s.fonts.mono,
        fontSize: 11.5,
        width: 48
    },
    opp: {
        flex: 1,
        fontFamily: s.fonts.bodySemi,
        fontSize: 14
    },
    pick: {
        width: 34,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    pickText: {
        fontFamily: s.fonts.monoBold,
        fontSize: 13
    },
    result: {
        borderRadius: 14,
        padding: 12,
        gap: 8,
        marginTop: 12
    },
    line: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start'
    },
    lineText: {
        flex: 1,
        fontFamily: s.fonts.body,
        fontSize: 14,
        lineHeight: 19
    }
});

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { FlatList as O1, Modal as N, Platform, Pressable as L1, StyleSheet as s, Text as A1, View as C1 } from 'react-native';
import t from 'react';







import * as f from '@expo/vector-icons';
import * as u from 'react-native-safe-area-context';
import p from '@react-native-async-storage/async-storage';
import * as h from './data';
import * as y from './topics';
import * as b from './sports';
import * as x from './theme';
import * as j from './links';

export const useAlerts = function() {
    const [e, setE] = t.useState(C);
    t.useEffect(()=>{
        p.getItem(T).then((e)=>{
            if (e) {
                setE({
                    ...C,
                    ...JSON.parse(e)
                });
            }
        }).catch(()=>{});
    }, []);
    const n = (e)=>setE((t)=>{
            const o = e(t);
            p.setItem(T, JSON.stringify(o)).catch(()=>{});
            return o;
        });
    return {
        prefs: e,
        level: (t)=>e.teams[t] ?? 'big',
        setLevel: (e, t)=>n((o)=>({
                    ...o,
                    teams: {
                        ...o.teams,
                        [e]: t
                    }
                })),
        followsPlayer: (t, o)=>e.players.includes(playerKey(t, o)),
        togglePlayer: (e, t)=>n((o)=>{
                const n = playerKey(e, t);
                return {
                    ...o,
                    players: o.players.includes(n) ? o.players.filter((e)=>e !== n) : [
                        ...o.players,
                        n
                    ]
                };
            }),
        topicsFor: (t)=>e.teamTopics[t] ?? w,
        setTopic: (e, t, o)=>n((n)=>{
                const l = n.teamTopics[e] ?? w;
                const s = o ? [
                    ...new Set([
                        ...l,
                        t
                    ])
                ] : l.filter((e)=>e !== t);
                return {
                    ...n,
                    teamTopics: {
                        ...n.teamTopics,
                        [e]: s
                    }
                };
            }),
        markSeen: ()=>n((e)=>({
                    ...e,
                    lastSeen: Date.now()
                }))
    };
};
export const collectAlerts = function(e, t, o, n, l = 3) {
    const s = Date.now() - 86400000 * l;
    const a = [];
    const c = new Set;
    for (const l of t){
        const t = e[l.id];
        if (t) {
            for (const item of t.items){
                if (item.at < s || c.has(item.url)) {
                    continue;
                }
                const reason = alertReason(item, t.team ?? l, o, n(l.id));
                if (reason) {
                    a.push({
                        item,
                        team: t.team ?? l,
                        reason
                    });
                    c.add(item.url);
                }
            }
        }
    }
    return a.sort((e, t)=>t.item.at - e.item.at);
};
export const AlertsSheet = function({ open, onClose, alerts, A: A_1, teams, onPlayer }) {
    const c = x.usePalette();
    const O = u.useSafeAreaInsets();
    const [v, setV] = t.useState('inbox');
    const [z, setZ] = t.useState(null);
    const L = t.useMemo(()=>A_1.prefs.lastSeen, [
        open
    ]);
    if (!open) {
        return null;
    }
    const A = ()=>{
        A_1.markSeen();
        onClose();
    };
    return <N visible animationType="slide" presentationStyle="pageSheet" onRequestClose={A} transparent={false}><C1 style={[
        I.sheet,
        {
            backgroundColor: c.surface
        },
        false
    ]}><C1 style={I.top}><C1 style={[
        I.grab,
        {
            backgroundColor: c.surface2
        }
    ]}/><L1 onPress={A} style={[
        I.close,
        {
            backgroundColor: c.surface2
        }
    ]} accessibilityLabel="Close"><f.Ionicons name="close" size={18} color={c.fg}/></L1></C1><A1 style={[
        I.h1,
        {
            color: c.fg
        }
    ]}>Alerts</A1><C1 style={[
        I.seg,
        {
            backgroundColor: c.surface2
        }
    ]}>{[
        'inbox',
        'settings'
    ].map((e)=><L1 key={e} onPress={()=>setV(e)} style={[
            I.segBtn,
            v === e && {
                backgroundColor: c.surface
            }
        ]}><f.Ionicons name={e === 'inbox' ? 'notifications-outline' : 'options-outline'} size={15} color={v === e ? c.fg : c.muted}/><A1 style={[
            I.segText,
            {
                color: v === e ? c.fg : c.muted
            }
        ]}>{e === 'inbox' ? 'Inbox' : 'What to alert'}</A1></L1>)}</C1>{v === 'inbox' ? <O1 data={alerts} keyExtractor={(e)=>e.item.id + e.team.id} contentContainerStyle={{
        paddingBottom: O.bottom + 24
    }} ListEmptyComponent=<A1 style={[
        I.empty,
        {
            color: c.muted
        }
    ]}>Nothing yet. Alerts for your teams, players and topics land here.</A1> renderItem={({ item })=>{
        const t = item.item.at > L;
        return <L1 onPress={()=>j.openLink(item.item.url)} style={[
            I.row,
            {
                borderBottomColor: c.line
            }
        ]}><C1 style={[
            I.dot,
            {
                backgroundColor: t ? item.team.color : 'transparent'
            }
        ]}/><C1 style={{
            flex: 1,
            minWidth: 0,
            gap: 3
        }}><A1 style={[
            I.meta,
            {
                color: c.muted
            }
        ]} numberOfLines={1}>{b.schoolName(item.team.name)} {b.SPORTS.find((t)=>t.id === b.sportOf(item.team.id))?.label} · {item.reason} · {h.timeAgo(item.item.at)}</A1><A1 style={[
            I.title,
            {
                color: c.fg
            }
        ]} numberOfLines={3}>{item.item.title}</A1><A1 style={[
            I.meta,
            {
                color: c.muted
            }
        ]} numberOfLines={1}>{item.item.show ?? item.item.source}</A1></C1></L1>;
    }}/> : <O1 data={[
        ...teams
    ].sort((e, t)=>teams.findIndex((t)=>b.schoolKey(t) === b.schoolKey(e)) - teams.findIndex((e)=>b.schoolKey(e) === b.schoolKey(t)) || b.SPORTS.findIndex((t)=>t.id === b.sportOf(e.id)) - b.SPORTS.findIndex((e)=>e.id === b.sportOf(t.id)))} keyExtractor={(e)=>e.id} contentContainerStyle={{
        paddingBottom: O.bottom + 24,
        gap: 10
    }} ListHeaderComponent=<A1 style={[
        I.hint,
        {
            color: c.muted,
            marginTop: 10
        }
    ]}>Tap a team to choose what buzzes your phone.</A1> renderItem={({ item })=>{
        const t = A_1.level(item.id);
        const o = x.headFor(item.color);
        const n = A_1.topicsFor(item.id);
        const expanded = z === item.id;
        const length = ALERT_TOPICS.filter((e)=>n.includes(e.id)).length;
        const p = t === 'all' ? 'Everything' : t === 'off' ? 'Off' : length === ALERT_TOPICS.length ? 'All 5 topics' : length ? ALERT_TOPICS.filter((e)=>n.includes(e.id)).map((e)=>e.label.split(' ')[0]).join(', ') : 'No topics on';
        return <C1 style={[
            I.card,
            {
                backgroundColor: c.bg,
                borderColor: c.line
            }
        ]}><L1 onPress={()=>setZ(expanded ? null : item.id)} style={I.cardHead} accessibilityRole="button" accessibilityState={{
            expanded
        }} accessibilityLabel={`${b.schoolName(item.name)} ${b.SPORTS.find((t)=>t.id === b.sportOf(item.id))?.label} alerts`}><C1 style={[
            I.mark,
            {
                backgroundColor: o
            }
        ]}><A1 style={I.markText}>{item.short.slice(0, 4)}</A1></C1><C1 style={{
            flex: 1,
            minWidth: 0
        }}><A1 style={[
            I.title,
            {
                color: c.fg
            }
        ]} numberOfLines={1}>{b.schoolName(item.name)} {b.SPORTS.find((t)=>t.id === b.sportOf(item.id))?.label}</A1><A1 style={[
            I.meta,
            {
                color: t === 'off' ? c.muted : x.inkFor(item.color, c)
            }
        ]} numberOfLines={1}>{p}</A1></C1><f.Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted}/></L1>{expanded ? <><RComponent c={c} color={o} value={t} onChange={(t)=>A_1.setLevel(item.id, t)} options={[
            [
                'all',
                'Everything'
            ],
            [
                'big',
                'Pick topics'
            ],
            [
                'off',
                'Off'
            ]
        ]}/>{t === 'big' ? <C1 style={{
            marginTop: 4
        }}>{ALERT_TOPICS.map((t)=>{
            const l = n.includes(t.id);
            return <C1 key={t.id} style={[
                I.topicRow,
                {
                    borderTopColor: c.line
                }
            ]}><f.Ionicons name={t.icon} size={17} color={l ? x.inkFor(item.color, c) : c.muted}/><A1 style={[
                I.topicText,
                {
                    color: l ? c.fg : c.muted
                }
            ]}>{t.label}</A1><RComponent small c={c} color={o} value={l ? 'on' : 'off'} onChange={(o)=>A_1.setTopic(item.id, t.id, o === 'on')} options={[
                [
                    'on',
                    'On'
                ],
                [
                    'off',
                    'Off'
                ]
            ]}/></C1>;
        })}</C1> : <A1 style={[
            I.hint,
            {
                color: c.muted,
                marginTop: 8
            }
        ]}>{t === 'all' ? 'Every story, video and team post.' : 'No alerts for this team, except players you follow.'}</A1>}</> : null}</C1>;
    }} ListFooterComponent=<C1><A1 style={[
        I.section,
        {
            color: c.fg
        }
    ]}>Players</A1>{A_1.prefs.players.length ? A_1.prefs.players.map((e)=>{
        const [t, o] = e.split('|');
        const n = teams.find((e)=>e.id === t);
        return <C1 key={e} style={[
            I.trow,
            {
                borderBottomColor: c.line
            }
        ]}><f.Ionicons name="person-circle-outline" size={26} color={n?.color ?? c.muted}/><L1 onPress={()=>onPlayer(t, o)} style={{
            flex: 1
        }}><A1 style={[
            I.title,
            {
                color: c.fg
            }
        ]}>{o}</A1><A1 style={[
            I.meta,
            {
                color: c.muted
            }
        ]}>{n ? `${b.schoolName(n.name)} ${b.SPORTS.find((e)=>e.id === b.sportOf(n.id))?.label}` : ''}</A1></L1><L1 onPress={()=>A_1.togglePlayer(t, o)} hitSlop={10}><A1 style={[
            I.link,
            {
                color: c.muted
            }
        ]}>Remove</A1></L1></C1>;
    }) : <A1 style={[
        I.hint,
        {
            color: c.muted
        }
    ]}>Open any player page and tap “Alerts” to get every story, clip and post about him.</A1>}</C1>/>}</C1></N>;
};
export { alpha } from "./theme";
const T = 'dh.alerts.v1';
export const ALERT_TOPICS = [
    {
        id: 'games',
        label: 'Scores & recaps',
        icon: 'trophy-outline',
        from: [
            'games'
        ]
    },
    {
        id: 'injuries',
        label: 'Injuries',
        icon: 'medkit-outline',
        from: [
            'injuries'
        ]
    },
    {
        id: 'moves',
        label: 'Transfers & recruiting',
        icon: 'swap-horizontal',
        from: [
            'portal',
            'recruiting'
        ]
    },
    {
        id: 'coaching',
        label: 'Coaching moves',
        icon: 'clipboard-outline',
        from: [
            'coaching'
        ]
    },
    {
        id: 'rankings',
        label: 'Rankings & polls',
        icon: 'podium-outline',
        from: [
            'rankings'
        ]
    }
];
const w = ALERT_TOPICS.map((e)=>e.id);
const C = {
    teams: {},
    teamTopics: {},
    players: [],
    topics: [],
    lastSeen: 0
};
export const playerKey = (e, t)=>`${e}|${t}`;
export function alertReason(e, t, o, n) {
    const l = b.sportOf(t.id);
    const s = e.players.find((e)=>o.players.includes(playerKey(t.id, e)));
    if (s) {
        return s;
    }
    if (n === 'off') {
        return null;
    }
    if (n === 'all') {
        return 'All news';
    }
    if (e.kind !== 'news' && e.kind !== 'video' && e.by !== 'team') {
        return null;
    }
    const a = y.topicsOf(e, l);
    const c = o.teamTopics[t.id] ?? w;
    const f = /\b(rank\w*|top 25|ap poll|coaches poll|cfp|playoff|bowl|power rankings?|bracketology|ncaa tournament|march madness)\b/i.test(`${e.title} ${e.summary ?? ''}`);
    const u = ALERT_TOPICS.find((e)=>c.includes(e.id) && e.from.some((e)=>a.includes(e)) && (e.id !== 'rankings' || f));
    if (u) {
        return u.label;
    }
    return null;
}
function RComponent({ c: c_1, color, value, onChange, options, small }) {
    return <C1 style={[
        I.levels,
        {
            backgroundColor: c_1.surface2
        },
        !small && {
            marginTop: 10
        }
    ]}>{options.map(([s, c])=>{
        const checked = value === s;
        return <L1 key={s} onPress={()=>onChange(s)} accessibilityRole="radio" accessibilityState={{
            checked
        }} accessibilityLabel={c} style={[
            I.level,
            !small && {
                flex: 1,
                alignItems: 'center'
            },
            small && {
                minWidth: 40,
                alignItems: 'center'
            },
            checked && {
                backgroundColor: s === 'off' ? c_1.fg : color
            }
        ]}><A1 style={[
            I.levelText,
            {
                color: checked ? s === 'off' ? c_1.bg : '#fff' : c_1.muted
            }
        ]}>{c}</A1></L1>;
    })}</C1>;
}
const I = s.create({
    card: {
        borderRadius: 16,
        borderWidth: s.hairlineWidth,
        paddingHorizontal: 14,
        paddingVertical: 12
    },
    cardHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        borderTopWidth: s.hairlineWidth
    },
    topicText: {
        flex: 1,
        fontFamily: x.fonts.bodySemi,
        fontSize: 14
    },
    sheet: {
        flex: 1,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 20
    },
    sheetAndroid: {
        flex: 0,
        marginTop: 'auto',
        maxHeight: '90%',
        minHeight: '70%'
    },
    top: {
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 10
    },
    grab: {
        width: 40,
        height: 5,
        borderRadius: 5
    },
    close: {
        position: 'absolute',
        right: 0,
        top: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    h1: {
        fontFamily: x.fonts.display,
        fontSize: 26,
        letterSpacing: -0.6
    },
    seg: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        gap: 4,
        marginTop: 12,
        marginBottom: 6
    },
    segBtn: {
        flex: 1,
        height: 34,
        borderRadius: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },
    segText: {
        fontFamily: x.fonts.bodySemi,
        fontSize: 13.5
    },
    empty: {
        fontFamily: x.fonts.body,
        textAlign: 'center',
        paddingVertical: 40,
        fontSize: 14
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 12,
        borderBottomWidth: s.hairlineWidth
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6
    },
    meta: {
        fontFamily: x.fonts.body,
        fontSize: 12
    },
    title: {
        fontFamily: x.fonts.bodySemi,
        fontSize: 15,
        lineHeight: 20
    },
    section: {
        fontFamily: x.fonts.display,
        fontSize: 17,
        marginTop: 18,
        marginBottom: 4
    },
    trow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: s.hairlineWidth
    },
    mark: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    markText: {
        color: '#fff',
        fontFamily: x.fonts.display,
        fontSize: 9
    },
    levels: {
        flexDirection: 'row',
        borderRadius: 9,
        padding: 3,
        gap: 2
    },
    level: {
        paddingHorizontal: 10,
        height: 30,
        borderRadius: 7,
        justifyContent: 'center'
    },
    levelText: {
        fontFamily: x.fonts.bodySemi,
        fontSize: 12
    },
    hint: {
        fontFamily: x.fonts.body,
        fontSize: 13,
        lineHeight: 18
    },
    link: {
        fontFamily: x.fonts.bodySemi,
        fontSize: 13
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 10
    },
    chipText: {
        fontFamily: x.fonts.bodySemi,
        fontSize: 13
    }
});
export const alertsBadgeStyle = (e, backgroundColor)=>({
        backgroundColor,
        borderColor: e.bg
    });

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Image as L1, Pressable as A1, StyleSheet as o, Text as S1, View as I1 } from 'react-native';
import t from 'react';





import * as r from '@expo/vector-icons';
import * as n from './data';
import * as d from 'expo-linear-gradient';
import * as c from './theme';
import * as f from './links';
import * as u from './sports';

export const useGameEvent = function(e, l = false) {
    const [a, setA] = t.useState(null);
    t.useEffect(()=>{
        setA(null);
        if (!e) {
            return;
        }
        const t = g(e.id);
        const a = x(e.id);
        if (!t || !a) {
            return;
        }
        let s = false;
        const i = async ()=>{
            try {
                const e = (await Promise.all([
                    b(`${y}/${t}/teams/${a}/schedule`).catch(()=>null),
                    b(`${y}/${t}/teams/${a}/schedule?seasontype=3`).catch(()=>null)
                ])).flatMap((e)=>e?.events ?? []).map((e)=>({
                        id: String(e.id),
                        date: Date.parse(e.date),
                        name: e.shortName || e.name,
                        state: e.competitions?.[0]?.status?.type?.state ?? 'pre'
                    }));
                const i = Date.now();
                const r = e.find((e)=>e.state === 'in');
                const n = e.find((e)=>e.state === 'pre' && e.date - i < 14400000 && e.date - i > -21600000);
                const d = e.filter((e)=>e.state === 'post' && i - e.date < 28800000).sort((e, t)=>t.date - e.date)[0];
                const c = e.filter((e)=>e.state === 'post').sort((e, t)=>t.date - e.date)[0];
                if (!s) {
                    setA((r || n || d || (l ? c : undefined)) ?? null);
                }
            } catch  {}
        };
        i();
        const r = setInterval(i, 300000);
        return ()=>{
            s = true;
            clearInterval(r);
        };
    }, [
        e?.id,
        l
    ]);
    return a;
};
export const GameCenter = function({ team, ev, items, c: c_1, color }) {
    const s = useJ(team.id, ev);
    const b = useW(team.id);
    const [k, setK] = t.useState('live');
    const color_1 = c_1.dark ? c.lift(color, 0.45) : color;
    const D = s?.header?.competitions?.[0];
    const I = D?.competitors ?? [];
    const F = I.find((e)=>e.homeAway === 'away');
    const z = I.find((e)=>e.homeAway === 'home');
    const B = I.find((t)=>String(t.team?.id) === x(team.id));
    const V = I.find((e)=>e !== B);
    const P = S(s);
    const N = P?.state === 'in';
    const L = t.useMemo(()=>(s?.leaders ?? []).flatMap((e)=>(e.leaders ?? []).map((t)=>({
                    team: e.team?.abbreviation,
                    cat: t.displayName,
                    name: t.leaders?.[0]?.athlete?.displayName,
                    line: t.leaders?.[0]?.displayValue,
                    id: String(t.leaders?.[0]?.athlete?.id ?? ''),
                    photo: t.leaders?.[0]?.athlete?.headshot?.href
                }))).filter((e)=>e.name), [
        s
    ]);
    const W = t.useMemo(()=>{
        const e = new Set(L.map((e)=>e.id));
        const t = Math.floor(Date.now() / 600000);
        const l = b.filter((t)=>!e.has(t.id)).sort((e, l)=>(7 * +e.id + t) % 97 - (7 * +l.id + t) % 97);
        return [
            ...b.filter((t)=>e.has(t.id)),
            ...l
        ].slice(0, 4);
    }, [
        b,
        L
    ]);
    const A = [
        V?.team?.location,
        V?.team?.name,
        V?.team?.shortDisplayName
    ].filter(Boolean);
    const H = items.filter((e)=>(e.kind === 'news' || e.kind === 'video' || e.kind === 'pod') && A.some((t)=>t.length > 3 && e.title.toLowerCase().includes(t.toLowerCase()))).slice(0, 5);
    const M = items.filter((e)=>(e.kind === 'board' || e.kind === 'social') && Date.now() - e.at < 43200000).slice(0, 5);
    const E = s?.gameInfo?.venue;
    const _ = [
        E?.address?.city,
        E?.address?.state
    ].filter(Boolean).join(', ');
    const G = (s?.broadcasts ?? []).map((e)=>e.media?.shortName).filter(Boolean).join(', ') || D?.broadcasts?.[0]?.media?.shortName;
    const O = s?.winprobability?.length ? s.winprobability[s.winprobability.length - 1] : null;
    const U = (s?.scoringPlays ?? []).slice().reverse();
    const Q = s?.situation?.lastPlay?.text;
    const q = s?.situation?.downDistanceText;
    if (!s) {
        return <S1 style={[
            T.muted,
            {
                color: c_1.muted,
                textAlign: 'center',
                marginTop: 40
            }
        ]}>Loading the game…</S1>;
    }
    const JComponent = ({ title, icon, children })=><I1 style={[
            T.card,
            {
                backgroundColor: c_1.surface
            }
        ]}><I1 style={T.cardHead}><r.Ionicons name={icon} size={16} color={color_1}/><S1 style={[
            T.cardTitle,
            {
                color: c_1.fg
            }
        ]}>{title}</S1></I1>{children}</I1>;
    const KComponent = ({ f })=><JComponent title="Did you know?" icon="bulb-outline"><I1 style={T.factRow}>{f.photo ? <L1 source={{
            uri: f.photo
        }} style={[
            T.headshot,
            {
                backgroundColor: c_1.surface2
            }
        ]}/> : null}<S1 style={[
            T.body,
            {
                color: c_1.fg,
                flex: 1
            }
        ]}>{f.text}</S1></I1><S1 style={[
            T.source,
            {
                color: c_1.muted
            }
        ]}>Source: ESPN roster</S1></JComponent>;
    const XComponent = ({ it })=><A1 onPress={()=>f.openLink(it.url)} style={({ pressed })=>[
                T.linkRow,
                {
                    borderTopColor: c_1.line
                },
                pressed && {
                    opacity: 0.7
                }
            ]}><I1 style={{
            flex: 1,
            minWidth: 0
        }}><S1 style={[
            T.linkTitle,
            {
                color: c_1.fg
            }
        ]} numberOfLines={2}>{it.title}</S1><S1 style={[
            T.small,
            {
                color: c_1.muted
            }
        ]} numberOfLines={1}>{it.show ?? it.source} · {n.timeAgo(it.at)}{it.replies ? ` \xb7 ${it.replies.toLocaleString()} replies` : ''}</S1></I1><r.Ionicons name="open-outline" size={15} color={c_1.muted}/></A1>;
    const Y = (t)=>{
        const l = String(t?.team?.id ?? '');
        if (l && team.id.endsWith(`-${l}`)) {
            return team.color;
        }
        const a = t?.team?.color ? `#${String(t.team.color).replace('#', '')}` : '#3A4150';
        return c.officialColor(`x-${l}`, /^#(0{6}|f{6})$/i.test(a) ? '#3A4150' : a);
    };
    return <I1 style={{
        gap: 10,
        marginTop: 10
    }}><d.LinearGradient colors={[
        Y(F),
        c.shade(Y(F), 0.35),
        c.shade(Y(z), 0.35),
        Y(z)
    ]} locations={[
        0,
        0.47,
        0.53,
        1
    ]} start={{
        x: 0,
        y: 0.5
    }} end={{
        x: 1,
        y: 0.5
    }} style={T.board}><I1 style={T.boardRow}>{[
        F,
        z
    ].map((e, t)=>{
        if (e) {
            return <I1 key={t} style={[
                T.side,
                t === 1 && {
                    alignItems: 'flex-end'
                }
            ]}>{e.team?.logos?.[0]?.href || e.team?.logo ? <L1 source={{
                uri: e.team?.logos?.[0]?.href || e.team?.logo
            }} style={T.logo}/> : null}<S1 style={T.abbr}>{e.rank && e.rank < 26 ? `#${e.rank} ` : ''}{e.team?.abbreviation}</S1><S1 style={T.rec}>{e.record?.[0]?.summary ?? ''}</S1></I1>;
        }
        return null;
    })}</I1><I1 style={T.scoreRow}><S1 style={T.score}>{F?.score ?? '–'}</S1><I1 style={{
        alignItems: 'center',
        flex: 1
    }}>{N ? <I1 style={T.liveTag}><I1 style={T.liveDot}/><S1 style={T.liveText}>LIVE</S1></I1> : null}<S1 style={T.status}>{P?.state === 'pre' ? new Date(ev.date).toLocaleString([], {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
    }) : P?.shortDetail ?? ''}</S1>{G ? <S1 style={T.tv}>{G}</S1> : null}</I1><S1 style={T.score}>{z?.score ?? '–'}</S1></I1>{N && q ? <S1 style={T.down}>{q}</S1> : null}{O && P?.state !== 'pre' ? <I1 style={{
        marginTop: 10
    }}><I1 style={T.wpBar}><I1 style={{
        flex: 1 - O.homeWinPercentage,
        backgroundColor: c.lift(Y(F), 0.35)
    }}/><I1 style={{
        flex: O.homeWinPercentage,
        backgroundColor: c.lift(Y(z), 0.35)
    }}/></I1><S1 style={T.wpText}>Win probability · {z?.team?.abbreviation} {Math.round(100 * O.homeWinPercentage)}%</S1></I1> : null}</d.LinearGradient><I1 style={[
        T.seg,
        {
            backgroundColor: c_1.surface2
        }
    ]}>{[
        [
            'live',
            N ? 'Live' : 'Game notes'
        ],
        [
            'box',
            'Box score'
        ],
        [
            'plays',
            'Plays'
        ]
    ].map(([e, t])=><A1 key={e} onPress={()=>setK(e)} style={[
            T.segBtn,
            k === e && {
                backgroundColor: c_1.surface
            }
        ]} accessibilityRole="tab" accessibilityState={{
            selected: k === e
        }}><S1 style={[
            T.segText,
            {
                color: k === e ? c_1.fg : c_1.muted
            }
        ]}>{t}</S1></A1>)}</I1>{k === 'live' ? <>{N && Q ? <JComponent title="Last play" icon="flash-outline"><S1 style={[
        T.body,
        {
            color: c_1.fg
        }
    ]}>{Q}</S1></JComponent> : null}{U.length ? <JComponent title="Scoring" icon="trophy-outline">{U.slice(0, 3).map((e, t)=><I1 key={t} style={[
            T.playRow,
            {
                borderTopColor: c_1.line
            }
        ]}><S1 style={[
            T.small,
            {
                color: c_1.muted,
                width: 62
            }
        ]}>Q{e.period?.number} {e.clock?.displayValue}</S1><S1 style={[
            T.body,
            {
                color: c_1.fg,
                flex: 1
            }
        ]}>{e.team?.abbreviation ? `${e.team.abbreviation}: ` : ''}{e.text}</S1></I1>)}</JComponent> : null}{L.length ? <JComponent title={P?.state === 'pre' ? 'Season leaders' : 'Game leaders'} icon="podium-outline">{L.slice(0, 6).map((e, t)=><I1 key={t} style={[
            T.playRow,
            {
                borderTopColor: c_1.line
            }
        ]}><S1 style={[
            T.small,
            {
                color: c_1.muted,
                width: 62
            }
        ]}>{e.team}</S1><I1 style={{
            flex: 1
        }}><S1 style={[
            T.body,
            {
                color: c_1.fg,
                fontFamily: c.fonts.bodySemi
            }
        ]}>{e.name}</S1><S1 style={[
            T.small,
            {
                color: c_1.muted
            }
        ]}>{e.cat}: {e.line}</S1></I1></I1>)}</JComponent> : null}{W[0] ? <KComponent f={W[0]}/> : null}{H.length ? <JComponent title="Storylines" icon="newspaper-outline">{H.map((e)=><XComponent key={e.id} it={e}/>)}</JComponent> : null}{W[1] ? <KComponent f={W[1]}/> : null}{M.length ? <JComponent title="Fans are saying" icon="chatbubbles-outline">{M.map((e)=><XComponent key={e.id} it={e}/>)}</JComponent> : null}{E ? <JComponent title="At the game" icon="location-outline"><S1 style={[
        T.body,
        {
            color: c_1.fg,
            fontFamily: c.fonts.bodySemi
        }
    ]}>{E.fullName}</S1><S1 style={[
        T.small,
        {
            color: c_1.muted
        }
    ]}>{[
        _,
        s?.gameInfo?.attendance ? `Attendance ${Number(s.gameInfo.attendance).toLocaleString()}` : '',
        s?.gameInfo?.weather?.displayValue ? `${s.gameInfo.weather.temperature ?? ''}\xb0 ${s.gameInfo.weather.displayValue}` : ''
    ].filter(Boolean).join(' · ')}</S1><I1 style={T.btnRow}>{[
        [
            'restaurant-outline',
            'Food nearby',
            `https://www.google.com/maps/search/restaurants+near+${encodeURIComponent(`${E.fullName} ${_}`)}`
        ],
        [
            'cafe-outline',
            'Drinks & treats',
            `https://www.google.com/maps/search/${encodeURIComponent(`soda drinks dessert near ${E.fullName} ${_}`)}`
        ],
        [
            'navigate-outline',
            'Directions',
            `https://www.google.com/maps/search/${encodeURIComponent(`${E.fullName} ${_}`)}`
        ]
    ].map(([name, t, l])=><A1 key={t} onPress={()=>f.openLink(l)} style={[
            T.btn,
            {
                backgroundColor: c_1.surface2
            }
        ]}><r.Ionicons name={name} size={15} color={c_1.fg}/><S1 style={[
            T.btnText,
            {
                color: c_1.fg
            }
        ]}>{t}</S1></A1>)}</I1></JComponent> : null}{W.slice(2).map((f_1)=><KComponent key={f_1.id} f={f_1}/>)}</> : k === 'box' ? <V1Component s={s} c={c_1}/> : <Component s={s} c={c_1}/>}<S1 style={[
        T.source,
        {
            color: c_1.muted,
            textAlign: 'center'
        }
    ]}>Scores and stats from ESPN. Updates every 20 seconds during the game.</S1></I1>;
};
const y = 'https://site.api.espn.com/apis/site/v2/sports';
const p = {
    'college-football': 'football/college-football',
    'mens-college-basketball': 'basketball/mens-college-basketball',
    nfl: 'football/nfl',
    nba: 'basketball/nba'
};
const g = (e)=>p[u.leagueOf(e)];
const x = (e)=>e.match(/(\d+)$/)?.[1] ?? '';
const b = async (e)=>{
    const t = await fetch(e);
    if (!t.ok) {
        throw new Error(String(t.status));
    }
    return t.json();
};
function useJ(e, l) {
    const [a, setA] = t.useState(null);
    t.useEffect(()=>{
        let t = false;
        const a = g(e);
        const s = ()=>b(`${y}/${a}/summary?event=${l.id}`).then((e)=>{
                if (!t) {
                    setA(e);
                }
            }).catch(()=>{});
        s();
        const i = setInterval(s, l.state === 'in' ? 20000 : 300000);
        return ()=>{
            t = true;
            clearInterval(i);
        };
    }, [
        e,
        l.id,
        l.state
    ]);
    return a;
}
function useW(e) {
    const [l, setL] = t.useState([]);
    t.useEffect(()=>{
        const t = g(e);
        const l = x(e);
        b(`${y}/${t}/teams/${l}/roster`).then((e)=>{
            const t = (e.athletes ?? []).flatMap((e)=>{
                if (e.items) {
                    return e.items;
                }
                return [
                    e
                ];
            });
            setL(t.filter((e)=>e.birthPlace?.displayText || e.experience?.displayValue).map((e)=>{
                const t = [
                    e.position?.displayName ? `${e.experience?.displayValue ? `${e.experience.displayValue.toLowerCase()} ` : ''}${e.position.displayName.toLowerCase()}` : e.experience?.displayValue?.toLowerCase(),
                    e.birthPlace?.displayText ? `from ${e.birthPlace.displayText}` : ''
                ].filter(Boolean).join(' ');
                const l = [
                    e.displayHeight,
                    e.displayWeight
                ].filter(Boolean).join(', ');
                return {
                    id: String(e.id),
                    name: e.displayName,
                    text: `${e.displayName}${e.jersey ? ` (#${e.jersey})` : ''} is a ${t}.${l ? ` Listed at ${l}.` : ''}`,
                    photo: e.headshot?.href
                };
            }));
        }).catch(()=>{});
    }, [
        e
    ]);
    return l;
}
const S = (e)=>e?.header?.competitions?.[0]?.status?.type;
function V1Component({ s, c: c_1 }) {
    const l = s?.boxscore?.teams ?? [];
    const a = s?.boxscore?.players ?? [];
    if (!l.length) {
        return <S1 style={[
            T.muted,
            {
                color: c_1.muted,
                textAlign: 'center',
                marginTop: 20
            }
        ]}>The box score starts once the game does.</S1>;
    }
    const o = (l[0].statistics ?? []).map((e)=>e.label);
    return <I1 style={{
        gap: 10
    }}><I1 style={[
        T.card,
        {
            backgroundColor: c_1.surface
        }
    ]}><I1 style={T.statHead}><S1 style={[
        T.small,
        {
            color: c_1.muted,
            flex: 1
        }
    ]}>Team stats</S1>{l.map((e)=><S1 key={e.team.id} style={[
            T.statVal,
            {
                color: c_1.fg,
                fontFamily: c.fonts.bodyBold
            }
        ]}>{e.team.abbreviation}</S1>)}</I1>{o.slice(0, 16).map((e, a)=><I1 key={e} style={[
            T.statRow,
            {
                borderTopColor: c_1.line
            }
        ]}><S1 style={[
            T.small,
            {
                color: c_1.fg,
                flex: 1
            }
        ]}>{e}</S1>{l.map((e)=><S1 key={e.team.id} style={[
                T.statVal,
                {
                    color: c_1.fg
                }
            ]}>{e.statistics?.[a]?.displayValue ?? ''}</S1>)}</I1>)}</I1>{a.map((e)=>(e.statistics ?? []).slice(0, 4).map((l)=><I1 key={`${e.team?.id}-${l.name}`} style={[
                T.card,
                {
                    backgroundColor: c_1.surface
                }
            ]}><S1 style={[
                T.cardTitle,
                {
                    color: c_1.fg,
                    marginBottom: 6
                }
            ]}>{e.team?.abbreviation} {l.text || l.name}</S1><I1 style={T.statHead}><S1 style={[
                T.small,
                {
                    color: c_1.muted,
                    flex: 1
                }
            ]}>Player</S1>{(l.labels ?? []).slice(0, 5).map((e)=><S1 key={e} style={[
                    T.statVal,
                    {
                        color: c_1.muted
                    }
                ]}>{e}</S1>)}</I1>{(l.athletes ?? []).slice(0, 5).map((e)=><I1 key={e.athlete?.id} style={[
                    T.statRow,
                    {
                        borderTopColor: c_1.line
                    }
                ]}><S1 style={[
                    T.small,
                    {
                        color: c_1.fg,
                        flex: 1
                    }
                ]} numberOfLines={1}>{e.athlete?.shortName || e.athlete?.displayName}</S1>{(e.stats ?? []).slice(0, 5).map((e, l)=><S1 key={l} style={[
                        T.statVal,
                        {
                            color: c_1.fg
                        }
                    ]}>{e}</S1>)}</I1>)}</I1>))}</I1>;
}
function Component({ s, c: c_1 }) {
    const l = [
        ...s?.drives?.current ? [
            s.drives.current
        ] : [],
        ...(s?.drives?.previous ?? []).slice().reverse()
    ];
    if (l.length) {
        return <I1 style={{
            gap: 10
        }}>{l.slice(0, 12).map((e, l)=><I1 key={e.id ?? l} style={[
                T.card,
                {
                    backgroundColor: c_1.surface
                }
            ]}><S1 style={[
                T.cardTitle,
                {
                    color: c_1.fg
                }
            ]}>{e.team?.abbreviation ?? e.team?.shortDisplayName} · {e.displayResult || e.result || 'Drive'}</S1><S1 style={[
                T.small,
                {
                    color: c_1.muted,
                    marginBottom: 4
                }
            ]}>{e.description}</S1>{(e.plays ?? []).slice().reverse().slice(0, 8).map((e, l)=><I1 key={l} style={[
                    T.playRow,
                    {
                        borderTopColor: c_1.line
                    }
                ]}><S1 style={[
                    T.small,
                    {
                        color: c_1.muted,
                        width: 62
                    }
                ]}>Q{e.period?.number} {e.clock?.displayValue}</S1><S1 style={[
                    T.small,
                    {
                        color: c_1.fg,
                        flex: 1
                    }
                ]}>{e.text}</S1></I1>)}</I1>)}</I1>;
    }
    const a = (s?.plays ?? []).slice().reverse().slice(0, 60);
    if (a.length) {
        return <I1 style={[
            T.card,
            {
                backgroundColor: c_1.surface
            }
        ]}>{a.map((e, l)=><I1 key={e.id ?? l} style={[
                T.playRow,
                {
                    borderTopColor: c_1.line
                }
            ]}><S1 style={[
                T.small,
                {
                    color: c_1.muted,
                    width: 62
                }
            ]}>{e.period?.displayValue ?? `P${e.period?.number}`} {e.clock?.displayValue}</S1><S1 style={[
                T.small,
                {
                    color: c_1.fg,
                    flex: 1
                },
                e.scoringPlay && {
                    fontFamily: c.fonts.bodyBold
                }
            ]}>{e.text}</S1>{e.scoringPlay ? <S1 style={[
                T.small,
                {
                    color: c_1.fg
                }
            ]}>{e.awayScore}–{e.homeScore}</S1> : null}</I1>)}</I1>;
    }
    return <S1 style={[
        T.muted,
        {
            color: c_1.muted,
            textAlign: 'center',
            marginTop: 20
        }
    ]}>Plays show up here once the game starts.</S1>;
}
const T = o.create({
    board: {
        borderRadius: 18,
        padding: 16
    },
    boardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    side: {
        gap: 2
    },
    logo: {
        width: 38,
        height: 38
    },
    abbr: {
        color: '#fff',
        fontFamily: c.fonts.displayBold,
        fontSize: 16
    },
    rec: {
        color: 'rgba(255,255,255,0.75)',
        fontFamily: c.fonts.body,
        fontSize: 12
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6
    },
    score: {
        color: '#fff',
        fontFamily: c.fonts.display,
        fontSize: 44,
        letterSpacing: -1,
        minWidth: 64
    },
    status: {
        color: '#fff',
        fontFamily: c.fonts.bodyBold,
        fontSize: 14
    },
    tv: {
        color: 'rgba(255,255,255,0.75)',
        fontFamily: c.fonts.body,
        fontSize: 12,
        marginTop: 2
    },
    down: {
        color: '#fff',
        fontFamily: c.fonts.bodySemi,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 6
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 4
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#FF4D4F'
    },
    liveText: {
        color: '#fff',
        fontFamily: c.fonts.bodyBold,
        fontSize: 11
    },
    wpBar: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden'
    },
    wpText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: c.fonts.body,
        fontSize: 11.5,
        marginTop: 4,
        textAlign: 'right'
    },
    seg: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: 12
    },
    segBtn: {
        flex: 1,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9
    },
    segText: {
        fontFamily: c.fonts.bodySemi,
        fontSize: 13.5
    },
    card: {
        borderRadius: 16,
        padding: 14,
        gap: 4
    },
    cardHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 4
    },
    cardTitle: {
        fontFamily: c.fonts.bodyBold,
        fontSize: 14.5
    },
    body: {
        fontFamily: c.fonts.body,
        fontSize: 14.5,
        lineHeight: 20
    },
    small: {
        fontFamily: c.fonts.body,
        fontSize: 12.5,
        lineHeight: 17
    },
    muted: {
        fontFamily: c.fonts.body,
        fontSize: 14
    },
    source: {
        fontFamily: c.fonts.body,
        fontSize: 11,
        marginTop: 4
    },
    factRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center'
    },
    headshot: {
        width: 56,
        height: 56,
        borderRadius: 28
    },
    playRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 7,
        borderTopWidth: o.hairlineWidth,
        alignItems: 'flex-start'
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        borderTopWidth: o.hairlineWidth
    },
    linkTitle: {
        fontFamily: c.fonts.bodySemi,
        fontSize: 14.5,
        lineHeight: 19.5
    },
    btnRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 12
    },
    btnText: {
        fontFamily: c.fonts.bodySemi,
        fontSize: 13
    },
    statHead: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 4
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderTopWidth: o.hairlineWidth
    },
    statVal: {
        width: 54,
        textAlign: 'right',
        fontFamily: c.fonts.body,
        fontSize: 12.5
    }
});

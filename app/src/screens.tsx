// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { FlatList as O1, Image as L1, Modal as N, Platform, Pressable as I1, ScrollView as S1, StyleSheet as a, Text as C1, TextInput as F1, View as U } from 'react-native';
import t from 'react';










import * as h from 'expo-linear-gradient';
import * as p from 'expo-blur';
import * as y from '@expo/vector-icons';
import * as g from 'react-native-safe-area-context';
import * as x from './data';
import * as b from './theme';
import * as j from './links';
import * as S from './sports';

export const GameCard = function({ team, schedule, onOpen }) {
    const { next, last } = nextAndLast(schedule);
    const s = next ?? (team.next?.date ? {
        date: team.next.date,
        oppName: team.next.opponent ?? '',
        home: team.next.home !== false,
        done: false,
        opp: '',
        status: team.next.status
    } : undefined);
    const [f, p] = x.countdown(s?.date, s?.status, T(team.id));
    const g = [
        team.conference,
        team.standing
    ].filter(Boolean).join(' · ');
    return <I1 onPress={onOpen} accessibilityLabel="Open games and standings"><h.LinearGradient colors={[
        b.lift(team.color, 0.16),
        team.color
    ]} start={{
        x: 1,
        y: 0
    }} end={{
        x: 0,
        y: 1
    }} style={B.card}><h.LinearGradient colors={[
        'transparent',
        'rgba(0,0,0,0.35)'
    ]} style={a.absoluteFill} start={{
        x: 0.3,
        y: 0
    }} end={{
        x: 0,
        y: 1
    }}/><U style={B.topRow}><U style={{
        flex: 1,
        minWidth: 0
    }}><C1 style={B.eyebrow} numberOfLines={1}>{g.toUpperCase()}</C1><C1 style={B.title} numberOfLines={1}>{team.name}</C1></U>{team.record ? <U style={B.record}><C1 style={B.recordText}>{team.record.replace('-', '–')}</C1></U> : null}</U>{s?.oppName ? <U style={B.next}><U style={{
        flex: 1,
        minWidth: 0,
        gap: 3
    }}><C1 style={B.small}>{s.status === 'in' ? 'LIVE NOW' : `NEXT \xb7 ${k(s.date).toUpperCase()} \xb7 ${C(s.date)}`}</C1><C1 style={B.opp} numberOfLines={1}>{z(s)} {L(s)}</C1>{s.tv || s.venue ? <U style={B.metaRow}>{s.tv ? <U style={B.tv}><y.Ionicons name="tv-outline" size={11} color="#fff"/><C1 style={B.tvText}>{s.tv}</C1></U> : null}{s.venue ? <C1 style={B.small} numberOfLines={1}>{s.venue}</C1> : null}</U> : null}</U><U style={{
        alignItems: 'flex-end'
    }}><C1 style={B.cd}>{f}</C1><C1 style={B.cdLabel}>{p.toUpperCase()}</C1></U></U> : null}{last ? <U style={B.lastRow}><U style={[
        B.wl,
        {
            backgroundColor: last.win ? b.STATUS.win : b.STATUS.loss
        }
    ]}><C1 style={B.wlText}>{last.win ? 'W' : 'L'}</C1></U><C1 style={B.lastText} numberOfLines={1}>{last.us}–{last.them} {z(last)} {last.oppName}</C1>{onOpen ? <C1 style={B.link}>Schedule ›</C1> : null}</U> : null}</h.LinearGradient></I1>;
};
export const GameStrip = function({ team, schedule, c, onOpen }) {
    const { next, last } = nextAndLast(schedule);
    const a = next ?? (team.next?.date ? {
        date: team.next.date,
        oppName: team.next.opponent ?? '',
        home: team.next.home !== false,
        done: false,
        opp: '',
        status: team.next.status
    } : undefined);
    if (!a?.oppName && !last) {
        return null;
    }
    const [f, h] = x.countdown(a?.date, a?.status, T(team.id));
    const color = c.dark ? b.lift(team.color, 0.45) : team.color;
    const g = a?.status === 'in';
    const j = a ? g ? 'Live now' : `${k(a.date)}, ${C(a.date)}${a.tv ? ` on ${a.tv}` : ''}` : '';
    return <I1 onPress={onOpen} accessibilityLabel="Open scores and schedule" style={({ pressed })=>[
            B.strip,
            {
                backgroundColor: c.surface
            },
            pressed && {
                opacity: 0.85
            }
        ]}><U style={[
        B.stripIcon,
        {
            backgroundColor: team.color
        }
    ]}><y.Ionicons name={/basketball/.test(team.id) ? 'basketball' : 'american-football'} size={18} color="#fff"/></U><U style={{
        flex: 1,
        minWidth: 0
    }}>{a?.oppName ? <><C1 style={[
        B.stripWhen,
        {
            color: g ? c.live : c.muted
        }
    ]} numberOfLines={1}>{j}</C1><C1 style={[
        B.stripOpp,
        {
            color: c.fg
        }
    ]} numberOfLines={1}>{z(a)} {L(a)}</C1></> : null}{last ? <C1 style={[
        B.stripWhen,
        {
            color: c.muted,
            marginTop: a?.oppName ? 2 : 0
        }
    ]} numberOfLines={1}>Last game: <C1 style={{
        color: last.win ? b.STATUS.win : b.STATUS.loss,
        fontFamily: b.fonts.bodyBold
    }}>{last.win ? 'W' : 'L'} {last.us}–{last.them}</C1> {z(last)} {last.oppShort || last.oppName}{team.record ? `, ${team.record}` : ''}</C1> : null}</U>{a?.oppName ? <U style={{
        alignItems: 'flex-end'
    }}><C1 style={[
        B.stripCd,
        {
            color
        }
    ]}>{f}</C1><C1 style={[
        B.stripCdLabel,
        {
            color: c.muted
        }
    ]}>{h}</C1></U> : <y.Ionicons name="chevron-forward" size={18} color={c.muted}/>}</I1>;
};
export const SectionTabs = function({ tabs, value, onChange, c, accent }) {
    return <S1 horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={B.tabs}>{tabs.map((e)=>{
        const s = e.key === value;
        return <I1 key={e.key} onPress={()=>onChange(e.key)} style={B.tab} accessibilityRole="tab" accessibilityState={{
            selected: s
        }} accessibilityLabel={e.label}><C1 style={[
            B.tabText,
            {
                color: s ? c.fg : c.muted,
                fontFamily: s ? b.fonts.bodyBold : b.fonts.bodySemi
            }
        ]}>{e.label}</C1><U style={[
            B.tabBar,
            {
                backgroundColor: s ? accent : 'transparent'
            }
        ]}/></I1>;
    })}</S1>;
};
export const ScheduleCard = function({ schedule, team, c }) {
    const { list, next } = nextAndLast(schedule);
    const [a, setA] = t.useState(false);
    const h = next ? list.indexOf(next) : list.length;
    const p = a ? list : list.slice(Math.max(0, h - 3), h + 4);
    return <U style={[
        B.box,
        {
            backgroundColor: c.surface,
            borderColor: c.line
        }
    ]}><U style={B.boxHead}><C1 style={[
        B.boxTitle,
        {
            color: c.fg
        }
    ]}>Schedule & results</C1><C1 style={[
        B.mono,
        {
            color: c.muted
        }
    ]}>{team.record ?? ''}</C1></U>{p.map((e)=>{
        const t = e === next;
        return <U key={`${e.opp}${e.date}`} style={[
            B.srow,
            {
                borderTopColor: c.line
            },
            t && {
                backgroundColor: b.alpha(team.color, c.dark ? 0.25 : 0.09)
            }
        ]}><C1 style={[
            B.sdate,
            {
                color: c.muted
            }
        ]}>{new Date(e.date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        })}</C1><C1 style={[
            B.sopp,
            {
                color: c.fg,
                fontFamily: t ? b.fonts.bodyBold : b.fonts.bodySemi
            }
        ]} numberOfLines={1}>{z(e)} {L(e)}</C1>{e.done ? <U style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        }}><C1 style={[
            B.res,
            {
                color: e.win ? b.STATUS.win : b.STATUS.loss
            }
        ]}>{e.win ? 'W' : 'L'}</C1><C1 style={[
            B.mono,
            {
                color: c.fg
            }
        ]}>{e.us}–{e.them}</C1></U> : <C1 style={[
            B.mono,
            {
                color: c.muted
            }
        ]} numberOfLines={1}>{e.status === 'in' ? 'LIVE' : `${C(e.date)}${e.tv ? ` \xb7 ${e.tv}` : ''}`}</C1>}</U>;
    })}{list.length > p.length || a ? <I1 onPress={()=>setA((e)=>!e)} hitSlop={8} style={{
        paddingTop: 10
    }}><C1 style={[
        B.linkDark,
        {
            color: c.fg
        }
    ]}>{a ? 'Show fewer' : `Full schedule \xb7 ${list.length} games`}</C1></I1> : null}</U>;
};
export const TopStories = function({ items, c, color, updatedAt, sources }) {
    if (items.length) {
        return <U style={[
            B.box,
            {
                backgroundColor: c.surface,
                borderColor: c.line,
                gap: 2
            }
        ]}><U style={[
            B.boxHead,
            {
                marginBottom: 4
            }
        ]}><U style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        }}><y.Ionicons name="flame" size={14} color={c.dark ? b.lift(color, 0.5) : color}/><C1 style={[
            B.boxTitle,
            {
                color: c.fg,
                fontSize: 15
            }
        ]}>Top stories right now</C1></U><C1 style={[
            B.mono,
            {
                color: c.muted
            }
        ]}>{x.timeAgo(updatedAt)} ago</C1></U>{items.map((e, n)=><I1 key={e.id} onPress={()=>j.openLink(e.url)} style={[
                B.top,
                n > 0 && {
                    borderTopWidth: a.hairlineWidth,
                    borderTopColor: c.line
                }
            ]}><C1 style={[
                B.topNum,
                {
                    color: c.dark ? b.lift(color, 0.5) : color
                }
            ]}>{n + 1}</C1><U style={{
                flex: 1,
                minWidth: 0
            }}><C1 style={[
                B.topTitle,
                {
                    color: c.fg
                }
            ]} numberOfLines={2}>{e.title}</C1><C1 style={[
                B.mono,
                {
                    color: c.muted,
                    marginTop: 3
                }
            ]} numberOfLines={1}>{e.show ?? e.source} · {x.timeAgo(e.at)}</C1></U>{e.image ? <L1 source={{
                uri: e.image
            }} style={B.topImg}/> : null}</I1>)}<C1 style={[
            B.mono,
            {
                color: c.muted,
                marginTop: 6
            }
        ]}>Ranked by how many of {sources} sources are covering it</C1></U>;
    }
    return null;
};
export const BottomNav = function({ value, onChange, color, badge }) {
    const n = b.usePalette();
    const s = g.useSafeAreaInsets();
    const f = n.dark ? b.lift(color, 0.5) : color;
    return <U style={[
        B.nav,
        {
            paddingBottom: Math.max(s.bottom, 8),
            borderTopColor: n.line
        }
    ]}><p.BlurView intensity={60} tint={n.dark ? 'dark' : 'light'} style={a.absoluteFill}/><U style={[
        a.absoluteFill,
        {
            backgroundColor: b.alpha(n.bg, 0.82)
        }
    ]}/><U style={B.navRow}>{v.map((o)=>{
        const s = o.key === value;
        return <I1 key={o.key} onPress={()=>onChange(o.key)} style={B.navBtn} accessibilityRole="tab" accessibilityState={{
            selected: s
        }} accessibilityLabel={o.label}><y.Ionicons name={s ? o.on : o.icon} size={22} color={s ? f : n.muted}/><C1 style={[
            B.navText,
            {
                color: s ? f : n.muted
            }
        ]}>{o.label}</C1>{badge?.[o.key] ? <U style={[
            B.navDot,
            {
                backgroundColor: f
            }
        ]}/> : null}</I1>;
    })}</U></U>;
};
export const MiniPlayer = function({ bottom }) {
    const t = b.usePalette();
    const o = j.useNowPlaying();
    if (!o.id || !o.meta) {
        return null;
    }
    const n = o.duration ? Math.min(100, o.time / o.duration * 100) : 0;
    const s = o.meta.color ?? t.fg;
    return <U style={[
        B.mini,
        {
            bottom,
            backgroundColor: t.surface,
            borderColor: t.line,
            shadowColor: '#000'
        }
    ]}><U style={[
        B.miniTrack,
        {
            backgroundColor: b.alpha(s, 0.15)
        }
    ]}><U style={{
        width: `${n}%`,
        height: '100%',
        backgroundColor: s
    }}/></U><U style={B.miniRow}>{o.meta.image ? <L1 source={{
        uri: o.meta.image
    }} style={B.miniArt}/> : <U style={[
        B.miniArt,
        {
            backgroundColor: s
        }
    ]}/>}<I1 onPress={()=>o.meta?.url && j.openLink(o.meta.url)} style={{
        flex: 1,
        minWidth: 0
    }}><C1 style={[
        B.miniTitle,
        {
            color: t.fg
        }
    ]} numberOfLines={1}>{o.meta.title}</C1><C1 style={[
        B.mono,
        {
            color: t.muted
        }
    ]} numberOfLines={1}>{o.meta.show}</C1></I1><I1 onPress={()=>j.seekBy(-15)} hitSlop={8} accessibilityLabel="Back 15 seconds"><y.Ionicons name="play-back-outline" size={20} color={t.fg}/></I1><I1 onPress={()=>j.toggleEpisode(o.id, 'resume')} style={[
        B.miniPlay,
        {
            backgroundColor: s
        }
    ]} accessibilityLabel={o.playing ? 'Pause' : 'Play'}><y.Ionicons name={o.playing ? 'pause' : 'play'} size={18} color="#fff" style={o.playing ? undefined : {
        marginLeft: 2
    }}/></I1><I1 onPress={()=>j.seekBy(30)} hitSlop={8} accessibilityLabel="Forward 30 seconds"><y.Ionicons name="play-forward-outline" size={20} color={t.fg}/></I1><I1 onPress={j.stopEpisode} hitSlop={8} accessibilityLabel="Close player"><y.Ionicons name="close" size={20} color={t.muted}/></I1></U></U>;
};
export const SearchSheet = function({ open, onClose, feed, onPlayer, onTopic }) {
    const T = b.usePalette();
    const k = g.useSafeAreaInsets();
    const [C, setC] = t.useState('');
    const L = C.trim().toLowerCase();
    const I = L.split(/\s+/).filter(Boolean);
    const v = t.useMemo(()=>{
        if (feed && L) {
            return feed.players.filter((e)=>I.every((t)=>`${e.name} ${e.num ?? ''} ${e.position ?? e.pos}`.toLowerCase().includes(t))).slice(0, 6);
        }
        return [];
    }, [
        feed,
        L
    ]);
    const R = t.useMemo(()=>{
        if (feed && L) {
            return feed.items.filter((e)=>I.every((t)=>`${e.title} ${e.summary ?? ''} ${e.source} ${e.show ?? ''} ${e.players.join(' ')}`.toLowerCase().includes(t))).slice(0, 61);
        }
        return [];
    }, [
        feed,
        L
    ]);
    if (!open) {
        return null;
    }
    const F = ()=>{
        setC('');
        onClose();
    };
    const O = feed?.team.color ?? T.fg;
    return <N visible animationType="slide" presentationStyle="pageSheet" onRequestClose={F} transparent={false}><U style={[
        B.sheet,
        {
            backgroundColor: T.surface
        },
        false
    ]}><U style={B.searchRow}><U style={[
        B.search,
        {
            backgroundColor: T.surface2
        }
    ]}><y.Ionicons name="search" size={17} color={T.muted}/><F1 autoFocus value={C} onChangeText={setC} placeholder={`Search ${feed ? S.schoolName(feed.team.name) : ''} players, stories, shows`} placeholderTextColor={T.muted} style={[
        B.searchInput,
        {
            color: T.fg
        }
    ]} autoCorrect={false} returnKeyType="search"/>{C ? <I1 onPress={()=>setC('')} hitSlop={8}><y.Ionicons name="close-circle" size={17} color={T.muted}/></I1> : null}</U><I1 onPress={F} hitSlop={8}><C1 style={[
        B.cancel,
        {
            color: T.fg
        }
    ]}>Cancel</C1></I1></U><O1 data={R.slice(0, 60)} keyExtractor={(e)=>e.id} keyboardShouldPersistTaps="handled" contentContainerStyle={{
        paddingBottom: k.bottom + 24
    }} ListHeaderComponent={L ? v.length ? <U style={{
        marginTop: 6,
        marginBottom: 8
    }}><C1 style={[
        B.mono,
        {
            color: T.muted,
            marginBottom: 6
        }
    ]}>PLAYERS</C1>{v.map((e)=><I1 key={e.name} onPress={()=>{
            F();
            onPlayer(e.name);
        }} style={[
            B.prow,
            {
                borderBottomColor: T.line
            }
        ]}><U style={[
            B.pimg,
            {
                backgroundColor: b.alpha(O, 0.15)
            }
        ]}>{e.photo ? <L1 source={{
            uri: e.photo
        }} style={{
            width: '100%',
            height: '100%'
        }}/> : null}</U><U style={{
            flex: 1
        }}><C1 style={[
            B.topTitle,
            {
                color: T.fg
            }
        ]}>{e.name}</C1><C1 style={[
            B.mono,
            {
                color: T.muted
            }
        ]}>{[
            e.num != null ? `#${e.num}` : '',
            e.position || e.pos,
            e.mentions ? `${e.mentions} stories` : ''
        ].filter(Boolean).join(' · ')}</C1></U><y.Ionicons name="chevron-forward" size={16} color={T.muted}/></I1>)}<C1 style={[
        B.mono,
        {
            color: T.muted,
            marginTop: 14
        }
    ]}>STORIES · {R.length > 60 ? '60+' : R.length}</C1></U> : <C1 style={[
        B.mono,
        {
            color: T.muted,
            marginTop: 6,
            marginBottom: 4
        }
    ]}>STORIES · {R.length > 60 ? '60+' : R.length}</C1> : <U style={{
        gap: 10,
        marginTop: 6
    }}><C1 style={[
        B.mono,
        {
            color: T.muted
        }
    ]}>TRY</C1><U style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    }}>{[
        'injury',
        'recruit',
        'portal',
        'depth chart',
        ...feed?.players.filter((e)=>e.mentions).slice(0, 3).map((e)=>e.name) ?? []
    ].map((e)=><I1 key={e} onPress={()=>setC(e)} style={[
            B.try,
            {
                backgroundColor: T.surface2
            }
        ]}><C1 style={[
            B.tryText,
            {
                color: T.fg
            }
        ]}>{e}</C1></I1>)}</U></U>} ListEmptyComponent={L ? <C1 style={[
        B.empty,
        {
            color: T.muted
        }
    ]}>Nothing in the last 10 days matches “{C}”.</C1> : null} renderItem={({ item })=><I1 onPress={()=>j.openLink(item.url)} style={[
            B.prow,
            {
                borderBottomColor: T.line,
                alignItems: 'flex-start'
            }
        ]}><U style={{
            flex: 1,
            minWidth: 0,
            gap: 3
        }}><C1 style={[
            B.topTitle,
            {
                color: T.fg
            }
        ]} numberOfLines={2}>{item.title}</C1><C1 style={[
            B.mono,
            {
                color: T.muted
            }
        ]} numberOfLines={1}>{item.show ?? item.source} · {x.timeAgo(item.at)}</C1></U>{item.image ? <L1 source={{
            uri: item.image
        }} style={B.topImg}/> : null}</I1>}/></U></N>;
};
const T = (e)=>{
    if (/basketball/.test(e)) {
        return 'tipoff';
    }
    return 'kickoff';
};
const k = (date)=>new Date(date).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
const C = (date)=>new Date(date).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
const z = (e)=>{
    if (e.neutral || e.home) {
        return 'vs';
    }
    return 'at';
};
const L = (e)=>`${e.oppRank ? `No. ${e.oppRank} ` : ''}${e.oppName}`;
export function nextAndLast(e, t = Date.now()) {
    const list = (e ?? []).slice().sort((e, t)=>e.date - t.date);
    const l = list.find((e)=>e.status === 'in');
    const next = l || list.find((e)=>!e.done && e.date > t - 14400000);
    const last = [
        ...list
    ].reverse().find((e)=>e.done);
    return {
        next,
        last,
        list
    };
}
const v = [
    {
        key: 'home',
        label: 'Home',
        icon: 'home-outline',
        on: 'home'
    },
    {
        key: 'games',
        label: 'Scores',
        icon: 'trophy-outline',
        on: 'trophy'
    },
    {
        key: 'watch',
        label: 'Watch',
        icon: 'play-circle-outline',
        on: 'play-circle'
    },
    {
        key: 'listen',
        label: 'Listen',
        icon: 'headset-outline',
        on: 'headset'
    },
    {
        key: 'boards',
        label: 'Boards',
        icon: 'chatbubbles-outline',
        on: 'chatbubbles'
    }
];
export const NAV_H = 58;
export const MINI_H = 62;
const B = a.create({
    strip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 11
    },
    stripIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    stripWhen: {
        fontFamily: b.fonts.body,
        fontSize: 12.5
    },
    stripOpp: {
        fontFamily: b.fonts.displayBold,
        fontSize: 16,
        letterSpacing: -0.2,
        marginTop: 1
    },
    stripCd: {
        fontFamily: b.fonts.displayBold,
        fontSize: 17,
        letterSpacing: -0.3
    },
    stripCdLabel: {
        fontFamily: b.fonts.body,
        fontSize: 11.5,
        marginTop: 1
    },
    tabs: {
        paddingHorizontal: 10,
        gap: 2
    },
    tab: {
        paddingHorizontal: 9,
        paddingTop: 8,
        alignItems: 'center'
    },
    tabText: {
        fontSize: 15,
        letterSpacing: -0.1
    },
    tabDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD43B'
    },
    tabBar: {
        height: 3,
        borderRadius: 2,
        alignSelf: 'stretch',
        marginTop: 8
    },
    card: {
        borderRadius: 22,
        padding: 16,
        overflow: 'hidden',
        marginTop: 12,
        gap: 12
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.78)',
        fontFamily: b.fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 1
    },
    title: {
        color: '#fff',
        fontFamily: b.fonts.display,
        fontSize: 26,
        letterSpacing: -0.8,
        marginTop: 4
    },
    record: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    recordText: {
        color: '#fff',
        fontFamily: b.fonts.monoBold,
        fontSize: 15
    },
    next: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.24)',
        borderRadius: 16,
        padding: 12
    },
    small: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: b.fonts.mono,
        fontSize: 11,
        flexShrink: 1
    },
    opp: {
        color: '#fff',
        fontFamily: b.fonts.displayBold,
        fontSize: 17
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2
    },
    tv: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    tvText: {
        color: '#fff',
        fontFamily: b.fonts.monoBold,
        fontSize: 11
    },
    cd: {
        color: '#fff',
        fontFamily: b.fonts.monoBold,
        fontSize: 18
    },
    cdLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: b.fonts.mono,
        fontSize: 9.5,
        letterSpacing: 0.8,
        marginTop: 3
    },
    lastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    wl: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },
    wlText: {
        color: '#fff',
        fontFamily: b.fonts.monoBold,
        fontSize: 12
    },
    lastText: {
        color: '#fff',
        fontFamily: b.fonts.bodySemi,
        fontSize: 14,
        flex: 1
    },
    link: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: b.fonts.bodySemi,
        fontSize: 13
    },
    box: {
        borderRadius: 18,
        borderWidth: a.hairlineWidth,
        padding: 14,
        marginTop: 12
    },
    boxHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    boxTitle: {
        fontFamily: b.fonts.display,
        fontSize: 17,
        letterSpacing: -0.3
    },
    mono: {
        fontFamily: b.fonts.mono,
        fontSize: 11.5
    },
    srow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderTopWidth: a.hairlineWidth,
        borderRadius: 8
    },
    sdate: {
        fontFamily: b.fonts.mono,
        fontSize: 11.5,
        width: 48
    },
    sopp: {
        flex: 1,
        fontSize: 14
    },
    res: {
        fontFamily: b.fonts.monoBold,
        fontSize: 13
    },
    linkDark: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 13
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10
    },
    topNum: {
        fontFamily: b.fonts.display,
        fontSize: 22,
        width: 18
    },
    topTitle: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 15,
        lineHeight: 20
    },
    topImg: {
        width: 64,
        height: 48,
        borderRadius: 8
    },
    nav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: a.hairlineWidth,
        overflow: 'hidden'
    },
    navRow: {
        flexDirection: 'row',
        height: NAV_H,
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center'
    },
    navBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3
    },
    navText: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 11
    },
    navDot: {
        position: 'absolute',
        top: 8,
        right: '30%',
        width: 7,
        height: 7,
        borderRadius: 4
    },
    mini: {
        position: 'absolute',
        left: 10,
        right: 10,
        height: MINI_H,
        borderRadius: 16,
        borderWidth: a.hairlineWidth,
        overflow: 'hidden',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 4
        },
        elevation: 6,
        maxWidth: 700,
        alignSelf: 'center'
    },
    miniTrack: {
        height: 3
    },
    miniRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 10
    },
    miniArt: {
        width: 40,
        height: 40,
        borderRadius: 8
    },
    miniTitle: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 14
    },
    miniPlay: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sheet: {
        flex: 1,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 16,
        paddingTop: 14
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6
    },
    search: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12
    },
    searchInput: {
        flex: 1,
        fontFamily: b.fonts.body,
        fontSize: 15.5
    },
    cancel: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 15
    },
    try: {
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center'
    },
    tryText: {
        fontFamily: b.fonts.bodySemi,
        fontSize: 13
    },
    prow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        borderBottomWidth: a.hairlineWidth
    },
    pimg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden'
    },
    empty: {
        fontFamily: b.fonts.body,
        textAlign: 'center',
        paddingVertical: 36,
        fontSize: 14
    }
});

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Animated as o, FlatList as L1, Image as N1, Linking as i, Modal as A1, Platform, Pressable as S1, RefreshControl as R1, ScrollView as D1, StyleSheet as c, Text as F1, TextInput as U1, View as H1 } from 'react-native';
import t from 'react';













import * as g from 'expo-linear-gradient';
import * as p from 'expo-status-bar';
import * as y from 'react-native-safe-area-context';
import * as b from '@expo/vector-icons';
import * as x from 'expo-haptics';
import j from '@react-native-async-storage/async-storage';
import * as w from '@expo-google-fonts/archivo';
import * as S from '@expo-google-fonts/onest';
import * as k from '@expo-google-fonts/jetbrains-mono';
import * as C from './src/data';
import * as T from './src/components';
import * as v from './src/theme';
import * as z from './src/feed';
import * as I from './src/account';
import * as R from './src/onboarding';
import * as P from './src/post';
import * as F from './src/shorts';
import * as B from './src/gamecenter';
import * as L from './src/links';
import * as D from './src/topics';
import * as H from './src/sports';
import * as O from './src/standings';
import * as W from './src/alerts';
import * as A from './src/clips';
import * as N from './src/screens';

const $ = (e)=>{
    if (e === 'standings') {
        return 'games';
    }
    if (e === 'video') {
        return 'watch';
    }
    if (e === 'listen' || e === 'pod' || e === 'radio') {
        return 'listen';
    }
    if (e === 'social') {
        return 'social';
    }
    if (e === 'talk' || e === 'boards') {
        return 'boards';
    }
    return 'home';
};
const E = [
    {
        key: 'all',
        label: 'Latest'
    },
    {
        key: 'clips',
        label: 'Highlights'
    },
    {
        key: 'news',
        label: 'News'
    },
    {
        key: 'standings',
        label: 'Standings'
    },
    {
        key: 'players',
        label: 'Players'
    },
    {
        key: 'listen',
        label: 'Podcasts'
    },
    {
        key: 'video',
        label: 'Video'
    },
    {
        key: 'social',
        label: 'Social'
    },
    {
        key: 'boards',
        label: 'Boards'
    }
];
const _ = (e)=>e.kind === 'social' || e.by === 'team';
const V = ()=>x.selectionAsync().catch(()=>{});
function GComponent() {
    const [e] = w.useFonts({
        Archivo_800ExtraBold: w.Archivo_800ExtraBold,
        Archivo_900Black: w.Archivo_900Black,
        Onest_400Regular: S.Onest_400Regular,
        Onest_500Medium: S.Onest_500Medium,
        Onest_600SemiBold: S.Onest_600SemiBold,
        Onest_700Bold: S.Onest_700Bold,
        JetBrainsMono_500Medium: k.JetBrainsMono_500Medium,
        JetBrainsMono_700Bold: k.JetBrainsMono_700Bold
    });
    if (e) {
        return <y.SafeAreaProvider><JComponent/></y.SafeAreaProvider>;
    }
    return null;
}
export { GComponent as default };
function JComponent() {
    const e = v.usePalette();
    const n = y.useSafeAreaInsets();
    const [i, setI] = t.useState('all');
    const [w, setW] = t.useState(null);
    const [k, setK] = t.useState(false);
    const [G, setG] = t.useState([]);
    const [U, setU] = t.useState(null);
    const [ie, setIe] = t.useState(false);
    const [se, setSe] = t.useState(170);
    const [, setDe] = t.useState(0);
    const [ce, setCe] = t.useState('latest');
    const [ue, setUe] = t.useState(null);
    const [topicsOpen, setTopicsOpen] = t.useState(false);
    const [pe, setPe] = t.useState(null);
    const [be, setBe] = t.useState(false);
    const [je, setJe] = t.useState('football');
    t.useEffect(()=>{
        j.getItem('bl.sport').then((e)=>{
            if (!(e !== 'football' && e !== 'basketball')) {
                setJe(e);
            }
        }).catch(()=>{});
    }, []);
    const [Se, setSe_1] = t.useState('any');
    const [Ce, setCe_1] = t.useState(false);
    const [visible, setVisible] = t.useState(false);
    const IeRef = t.useRef(null);
    t.useEffect(()=>{
        IeRef.current?.scrollToOffset({
            offset: 0,
            animated: false
        });
    }, [
        je,
        i
    ]);
    const current = t.useRef(new o.Value(0)).current;
    const PeRef = t.useRef(0);
    const FeRef = t.useRef(false);
    const Be = (e)=>{
        if (FeRef.current !== e) {
            FeRef.current = e;
            o.timing(current, {
                toValue: e ? -52 : 0,
                duration: 180,
                useNativeDriver: false
            }).start();
        }
    };
    const [Le, setLe] = t.useState('all');
    const [He, setHe] = t.useState('highlights');
    const [We, setWe] = t.useState('all');
    const [Ne, setNe] = t.useState(false);
    const [$e, set$e] = t.useState(false);
    const [Ve, setVe] = t.useState('boards');
    const [Je, setJe_1] = t.useState('all');
    const Ue = L.useNowPlaying();
    $(i);
    const A_1 = W.useAlerts();
    const Ye = z.useFeed();
    const Qe = I.useAccount();
    const [Xe, setXe] = t.useState(false);
    const [et, setEt] = t.useState(false);
    const { refresh, refreshing, live, offline, configured } = Ye;
    const st = Ye.sportFeeds.find((e)=>H.sportOf(e.team.id) === je) ?? Ye.sportFeeds[0];
    const rt = typeof location !== 'undefined' && /[?&]game\b/.test(location.search);
    const ev = B.useGameEvent(st?.team, rt);
    const tabs = ev ? [
        {
            key: 'game',
            label: ev.state === 'in' ? '● Live' : 'Game'
        },
        ...E
    ] : E;
    t.useEffect(()=>{
        if (!(ev || i !== 'game')) {
            setI('all');
        }
    }, [
        ev
    ]);
    const ft = t.useMemo(()=>{
        if (st) {
            return {
                ...st,
                team: {
                    ...st.team,
                    name: H.schoolName(st.team.name)
                }
            };
        }
        return Ye.feed;
    }, [
        st,
        Ye.feed
    ]);
    const { schools, active } = Ye;
    const team = ft?.team ?? schools.find((e)=>e.id === active) ?? schools[0];
    const color = team?.color ?? '#3C5A78';
    t.useEffect(()=>{
        j.getItem('bl.saved.v2').then((e)=>{
            if (e) {
                setG(JSON.parse(e));
            }
        }).catch(()=>{});
        const e = setInterval(()=>setDe((e)=>e + 1), 30000);
        return ()=>clearInterval(e);
    }, []);
    const pt = Ye.followed.map((e)=>e.id).join(',');
    t.useEffect(()=>{
        if (Ye.ready && pt) {
            Ye.loadAll(Ye.followed.map((e)=>e.id).filter((e)=>e !== Ye.active));
        }
    }, [
        Ye.ready,
        pt
    ]);
    const alerts = t.useMemo(()=>W.collectAlerts(Ye.feeds, Ye.followed, A_1.prefs, A_1.level), [
        Ye.feeds,
        Ye.followed,
        A_1.prefs
    ]);
    const length = alerts.filter((e)=>e.item.at > Math.max(A_1.prefs.lastSeen, Date.now() - 86400000)).length;
    const onPick = (e)=>{
        V();
        setW(e);
        setWe('all');
        setK(false);
        setUe(null);
    };
    const isSaved = (e)=>G.some((t)=>t.id === e);
    const onSave = (e)=>{
        x.impactAsync(x.ImpactFeedbackStyle.Light).catch(()=>{});
        setG((t)=>{
            const o = t.some((t)=>t.id === e.id) ? t.filter((t)=>t.id !== e.id) : [
                e,
                ...t
            ];
            j.setItem('bl.saved.v2', JSON.stringify(o.slice(0, 200))).catch(()=>{});
            return o;
        });
    };
    const St = w ? ft?.players.find((e)=>e.name === w) : undefined;
    const items = t.useMemo(()=>{
        if (!ft || k) {
            return [];
        }
        if (w) {
            const e = ft.items.filter((e)=>e.players.includes(w) || D.isOwnPost(e, St));
            switch(We){
                case 'posts':
                    return e.filter((e)=>D.isOwnPost(e, St));
                case 'mentions':
                    return e.filter((e)=>!D.isOwnPost(e, St));
                default:
                    return e;
            }
        }
        if (i === 'players' || i === 'game') {
            return [];
        }
        if (i === 'standings') {
            return [];
        }
        let e = i === 'all' ? ft.items : i === 'listen' ? ft.items.filter((e)=>{
            if (Je === 'all') {
                return e.kind === 'pod' || e.kind === 'radio';
            }
            return e.kind === Je;
        }) : i === 'boards' ? ft.items.filter((e)=>e.kind === 'board') : i === 'clips' ? ft.items.filter((e)=>A.clipKind(e) === He) : i === 'social' ? ft.items.filter((e)=>_(e) && (Le === 'all' || (Le === 'team' ? e.by === 'team' : Le === 'players' ? e.by === 'player' : e.by === 'fan' || e.kind === 'social' && !e.by))) : ft.items.filter((e)=>e.kind === i);
        if (pe) {
            e = e.filter((e)=>e.players.includes(pe));
        }
        return e;
    }, [
        ft,
        i,
        w,
        St,
        We,
        Le,
        He,
        pe,
        k,
        Je,
        Ve
    ]);
    const Ct = t.useMemo(()=>{
        const e = Se === 'day' ? Date.now() - 86400000 : Se === 'week' ? Date.now() - 604800000 : 0;
        return items.filter((t)=>t.at >= e && (!ue || D.topicsOf(t).includes(ue)));
    }, [
        items,
        ue,
        Se
    ]);
    const Tt = (ce === 'trending' ? 1 : 0) + (Se !== 'any' ? 1 : 0) + (ue ? 1 : 0) + (pe ? 1 : 0);
    const vt = st ? [
        st
    ] : [];
    const zt = t.useMemo(()=>{
        if (ft && ce === 'trending') {
            return D.trending(ft, Ct);
        }
        return null;
    }, [
        ft,
        Ct,
        ce
    ]);
    const It = t.useMemo(()=>new Map((zt ?? []).map((e, t)=>[
                e.item.id,
                t < 3 ? `#${t + 1}` : e.coverage > 1 ? `${e.coverage} sources` : ''
            ])), [
        zt
    ]);
    const Rt = t.useMemo(()=>{
        if (k) {
            return G;
        }
        if (!ft) {
            return [];
        }
        if (zt) {
            return zt.map((e)=>e.item);
        }
        const e = [
            ...Ct
        ];
        if (i === 'all' && !w && !Tt && e.length > 4) {
            e.splice(4, 0, {
                id: `sponsor-${active}`,
                kind: 'sponsor',
                team: active
            });
        }
        return e;
    }, [
        ft,
        Ct,
        zt,
        k,
        G,
        i,
        w,
        Tt,
        active
    ]);
    t.useMemo(()=>{
        if (ft) {
            return D.trending(ft, ft.items.filter((e)=>e.kind === 'news' || e.kind === 'video')).slice(0, 3).map((e)=>e.item);
        }
        return [];
    }, [
        ft
    ]);
    const teams = Ye.featured.length ? Ye.featured : Ye.followed;
    if (!Qe.loaded || !Ye.ready) {
        return <H1 style={{
            flex: 1,
            backgroundColor: e.bg
        }}/>;
    }
    if (!Qe.account || !Ye.followed.length || Xe) {
        return <R.Onboarding step={Qe.account ? 'teams' : 'welcome'} teams={teams} initial={Ye.followed} onSignIn={(e)=>{
            V();
            Qe.signIn(e);
        }} onCancel={Qe.account && Ye.followed.length ? ()=>setXe(false) : undefined} onDone={(e)=>{
            V();
            Ye.setFollowedList(e);
            setXe(false);
            setI('all');
            setW(null);
            setPe(null);
            setUe(null);
        }}/>;
    }
    const topics = D.topicCounts(items);
    const Bt = ft ? <Ee1Component c={e} color={color} sort={ce} topic={ue} topicsOpen={topicsOpen} topics={topics} byPlayer={w ? null : pe} showPlayer={!w} onSort={(e)=>{
        V();
        setCe(e);
    }} onTopics={()=>{
        V();
        if (ue) {
            setUe(null);
            setTopicsOpen(false);
        } else {
            setTopicsOpen((e)=>!e);
        }
    }} onTopic={(e)=>{
        V();
        setUe(e === ue ? null : e);
        setTopicsOpen(false);
    }} onPlayer={()=>{
        V();
        if (pe) {
            setPe(null);
        } else {
            setBe(true);
        }
    }}/> : null;
    const Lt = vt.filter((e)=>e.standings?.schedule?.some((e)=>!e.done && e.date < Date.now() + 1036800000) || e.team.next?.date && e.team.next.date < Date.now() + 1036800000);
    const Dt = Ye.sportFeeds.length > 1;
    const ListHeaderComponent = <H1>{offline && <YComponent c={e} bold="Offline." text=" Showing the last saved feed. Pull down to try again."/>}{k ? <Q1Component c={e} title="Saved" right={`${Rt.length} items`}/> : schools.length ? ft ? w ? <><KComponent feed={ft} name={w} c={e} following={A_1.followsPlayer(ft.team.id, w)} onFollow={()=>{
        V();
        A_1.togglePlayer(ft.team.id, w);
    }} count={ft.items.filter((e)=>e.players.includes(w) || D.isOwnPost(e, St)).length} onClear={()=>{
        V();
        setW(null);
        setI('players');
    }}/><Te1Component c={e} color={color} value={We} onChange={(e)=>{
        V();
        setWe(e);
    }} options={[
        {
            key: 'all',
            label: 'Everything',
            count: ft.items.filter((e)=>e.players.includes(w) || D.isOwnPost(e, St)).length
        },
        {
            key: 'posts',
            label: 'His posts',
            icon: 'phone-portrait-outline',
            count: ft.items.filter((e)=>D.isOwnPost(e, St)).length
        },
        {
            key: 'mentions',
            label: 'Mentions',
            icon: 'at',
            count: ft.items.filter((e)=>e.players.includes(w) && !D.isOwnPost(e, St)).length
        }
    ]}/>{Bt}</> : i === 'game' && ev ? <B.GameCenter key={ev.id} team={ft.team} ev={ev} items={ft.items} c={e} color={color}/> : i === 'all' ? <><H1 style={[
        le.games,
        {
            backgroundColor: e.line
        }
    ]}>{(Lt.length ? Lt : vt.slice(0, 1)).map((t)=><N.GameStrip key={t.team.id} team={t.team} schedule={t.standings?.schedule} c={e} onOpen={()=>{
            V();
            setI(ev ? 'game' : 'standings');
        }}/>)}</H1><H1 style={{
        height: 4
    }}/></> : i === 'players' ? <><T.PlayerGrid players={ft.players} color={color} c={e} onPick={onPick}/></> : i === 'standings' ? <>{vt.map((t)=><H1 key={t.team.id} style={{
            marginBottom: 8
        }}>{vt.length > 1 ? <F1 style={[
            le.sectionTitle,
            {
                color: e.fg,
                marginTop: 18,
                marginBottom: 2
            }
        ]}>{H.SPORTS.find((e)=>e.id === H.sportOf(t.team.id))?.label ?? ''}</F1> : null}<N.GameCard team={t.team} schedule={t.standings?.schedule}/>{t.standings?.schedule?.length ? <N.ScheduleCard schedule={t.standings.schedule} team={t.team} c={e}/> : null}{t.polls?.length ? <H1 style={{
            marginTop: 12
        }}><O.PollsCard polls={t.polls} team={t.team} c={e}/></H1> : null}{t.standings ? <O.StandingsPanel st={t.standings} team={t.team} c={e}/> : null}</H1>)}</> : i === 'video' || i === 'listen' || i === 'clips' ? null : i === 'social' ? <><Te1Component c={e} color={color} value={Le} onChange={(e)=>{
        V();
        setLe(e);
    }} options={[
        {
            key: 'all',
            label: 'All',
            count: ft.items.filter(_).length
        },
        {
            key: 'team',
            label: 'Team',
            count: ft.items.filter((e)=>e.by === 'team').length
        },
        {
            key: 'players',
            label: 'Players',
            count: ft.items.filter((e)=>e.by === 'player').length
        },
        {
            key: 'fans',
            label: 'Mentions',
            count: ft.items.filter((e)=>e.by === 'fan' || e.kind === 'social' && !e.by).length
        }
    ]}/></> : i === 'boards' ? <>{ft.boards?.length ? <D1 horizontal showsHorizontalScrollIndicator={false} style={{
        marginHorizontal: -16,
        marginTop: 12
    }} contentContainerStyle={le.frow}>{ft.boards.map((t)=><S1 key={t.url} onPress={()=>L.openLink(t.url)} style={[
            le.fchip,
            {
                backgroundColor: e.surface,
                borderColor: e.line
            }
        ]} accessibilityLabel={`Open ${t.name}`}><b.Ionicons name={/^r\//.test(t.name) ? 'logo-reddit' : 'chatbubbles-outline'} size={14} color={e.fg}/><F1 style={[
            le.fchipText,
            {
                color: e.fg
            }
        ]}>{t.name}</F1><b.Ionicons name="open-outline" size={13} color={e.muted}/></S1>)}</D1> : null}</> : null : <F1 style={[
        le.empty,
        {
            color: e.muted
        }
    ]}>{offline ? `Couldn't load ${team?.name ?? 'this team'}. Pull down to try again.` : `Loading ${team?.name ?? 'team'}\u2026`}</F1> : <H1 style={{
        paddingVertical: 40,
        alignItems: 'center',
        gap: 14
    }}><F1 style={[
        le.sectionTitle,
        {
            color: e.fg
        }
    ]}>Pick your teams</F1><F1 style={[
        le.fine,
        {
            color: e.muted,
            textAlign: 'center',
            marginTop: 0
        }
    ]}>Follow any team in any league to build your feed.</F1><S1 onPress={()=>setIe(true)} style={[
        le.primary,
        {
            backgroundColor: e.fg,
            flex: 0,
            paddingHorizontal: 22
        }
    ]}><F1 style={[
        le.primaryText,
        {
            color: e.bg
        }
    ]}>Browse leagues</F1></S1></H1>}{!ft || k || i === 'standings' || i === 'game' || i === 'players' && !w ? null : <H1 style={le.sortRow}>{[
        'latest',
        'trending'
    ].map((t)=>{
        const o = ce === t;
        return <S1 key={t} onPress={()=>{
            V();
            setCe(t);
        }} accessibilityRole="button" accessibilityState={{
            selected: o
        }} style={[
            le.sortBtn,
            {
                backgroundColor: o ? t === 'trending' ? v.BRAND.volt : e.fg : 'transparent',
                borderColor: o ? t === 'trending' ? v.BRAND.volt : e.fg : e.line
            }
        ]}><b.Ionicons name={t === 'latest' ? 'time-outline' : o ? 'flame' : 'flame-outline'} size={14} color={o ? t === 'trending' ? v.BRAND.voltInk : e.bg : e.muted}/><F1 style={[
            le.sortText,
            {
                color: o ? t === 'trending' ? v.BRAND.voltInk : e.bg : e.muted
            }
        ]}>{t === 'latest' ? 'Newest' : 'Trending'}</F1></S1>;
    })}</H1>}</H1>;
    return <H1 style={{
        flex: 1,
        backgroundColor: e.bg
    }}><p.StatusBar style="light"/>{i !== 'clips' || !ft || w || k ? null : <F.ShortsFeed key={`${ft.team.id}-clips-${He}`} items={Rt.filter((e)=>e.kind === 'video')} topInset={n.top} bottomInset={n.bottom + (Ue.id ? N.MINI_H + 12 : 0)} title={`${H.schoolName(ft.team.name)} ${H.sportOf(ft.team.id) === 'basketball' ? 'Basketball' : 'Football'}`} onClose={()=>{
        V();
        setI('all');
    }} isSaved={isSaved} onSave={onSave} empty={He === 'highlights' ? 'Highlight videos show up here after games.' : He === 'postgame' ? 'Postgame pressers and reactions show up here after each game.' : He === 'pregame' ? 'Previews and pregame interviews show up here before each game.' : 'Coach and player press conferences and interviews show up here.'} header=<D1 horizontal showsHorizontalScrollIndicator={false} style={{
        flexGrow: 0
    }} contentContainerStyle={le.darkPills}>{[
        'highlights',
        'postgame',
        'pregame',
        'interviews'
    ].map((e)=>{
        const t = He === e;
        const accessibilityLabel = e === 'highlights' ? 'Highlights' : e === 'postgame' ? 'Postgame' : e === 'pregame' ? 'Pregame' : 'Pressers';
        return <S1 key={e} onPress={()=>{
            V();
            setHe(e);
        }} accessibilityRole="tab" accessibilityState={{
            selected: t
        }} accessibilityLabel={accessibilityLabel} style={[
            le.pill,
            {
                height: 32,
                paddingHorizontal: 13,
                backgroundColor: t ? '#fff' : 'rgba(255,255,255,0.14)'
            }
        ]}><F1 style={[
            le.pillText,
            {
                color: t ? '#0D1017' : '#fff'
            }
        ]}>{accessibilityLabel}</F1></S1>;
    })}</D1>/>}{i !== 'video' || !ft || w || k ? null : <F.ShortsFeed key={`${ft.team.id}-${ce}`} items={Rt.filter((e)=>e.kind === 'video')} topInset={n.top} bottomInset={n.bottom + (Ue.id ? N.MINI_H + 12 : 0)} title={`${H.schoolName(ft.team.name)} ${H.sportOf(ft.team.id) === 'basketball' ? 'Basketball' : 'Football'} Video`} onClose={()=>{
        V();
        setI('all');
    }} isSaved={isSaved} onSave={onSave} empty="No videos in the last few days."/>}<L1 ref={IeRef} data={i !== 'video' && i !== 'clips' || w || k ? Rt : []} onScroll={(e)=>{
        const t = e.nativeEvent.contentOffset.y;
        const o = t - PeRef.current;
        PeRef.current = t;
        if (t < 40 || o < -6) {
            Be(false);
        } else if (o > 6 && t > 90) {
            Be(true);
        }
    }} scrollEventThrottle={16} keyExtractor={(e)=>e.id} contentContainerStyle={{
        paddingTop: se + 0,
        paddingBottom: n.bottom + (Ue.id ? N.MINI_H + 12 : 0) + 32,
        paddingHorizontal: 16,
        gap: 10,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center'
    }} progressViewOffset={se + 0} refreshControl={configured ? <R1 refreshing={refreshing} onRefresh={refresh} progressViewOffset={se + 0} tintColor={e.muted}/> : undefined} ListHeaderComponent={ListHeaderComponent} ListEmptyComponent={(i !== 'players' && i !== 'standings' && i !== 'game' || w || k) && ft ? <F1 style={[
        le.empty,
        {
            color: e.muted
        }
    ]}>{k ? 'Tap the bookmark on any story to save it here.' : ue || pe ? 'Nothing matches these filters. Try another topic or player.' : w && We === 'posts' ? St?.socials.length ? 'His own posts show here as soon as Diehard can read his accounts. Tap his handles above to see them now.' : 'No social accounts listed for him yet.' : i === 'boards' || i === 'talk' && Ve === 'boards' ? 'No new threads in the last few days. Tap a board above to open it.' : i === 'talk' && Ve === 'team' ? "The team's own posts and videos show here." : i === 'talk' && Ve === 'players' ? 'Posts from players on the roster show here once Diehard can read their accounts.' : i === 'talk' && Ve === 'fans' ? 'Posts from fans and reporters that mention the team show here.' : i === 'clips' ? He === 'highlights' ? 'More highlight videos show up here after games.' : He === 'postgame' ? 'Postgame pressers and reactions show up here after each game.' : He === 'pregame' ? 'Previews and pregame interviews show up here before each game.' : 'Coach and player press conferences and interviews show up here.' : i === 'social' && Le === 'team' ? "The team's own posts and videos show here." : i === 'social' && Le === 'players' ? 'Posts from players on the roster show here.' : i === 'social' && Le === 'fans' ? 'Posts from fans and reporters that mention the team show here.' : 'Nothing here in the last few days.'}</F1> : null} ListFooterComponent=<YComponent c={e} bold={live ? 'Unofficial fan app.' : 'Sample content.'} text={live ? ' Not affiliated with any team or school. Every story links to the outlet that made it.' : ' Connect your feed in src/config.ts to see live stories. Unofficial fan app, not affiliated with any team or school.'}/> renderItem={({ item })=>{
        if (item.kind === 'sponsor') {
            return <T.SponsorCard team={team} c={e}/>;
        }
        return <P.PostCard item={item} color={color} c={e} saved={isSaved(item.id)} onSave={()=>onSave(item)} badge={It.get(item.id) || undefined} onPlayer={ft?.players.some((e)=>item.players.includes(e.name)) ? onPick : undefined}/>;
    }}/><H1 style={[
        le.headerWrap,
        {
            zIndex: 3
        }
    ]} onLayout={(e)=>setSe(e.nativeEvent.layout.height)}><H1 style={[
        c.absoluteFill,
        {
            backgroundColor: e.bg
        }
    ]}/><g.LinearGradient colors={[
        v.headFor(color),
        v.bandFor(color)
    ]} start={{
        x: 0,
        y: 0
    }} end={{
        x: 1,
        y: 1
    }} style={{
        paddingTop: n.top + 4,
        paddingBottom: 10
    }}><H1 style={[
        le.brandRow,
        {
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center'
        }
    ]}><H1 style={le.mark} accessibilityLabel="Diehard"><F1 style={le.markText}>D</F1></H1><F1 style={le.brandWord}>DIEHARD</F1><H1 style={{
        flex: 1
    }}/><S1 onPress={()=>{
        V();
        set$e(true);
    }} style={le.iconBtn} accessibilityLabel="Search"><b.Ionicons name="search" size={21} color="#fff"/></S1><S1 onPress={()=>{
        V();
        setNe(true);
    }} style={le.iconBtn} accessibilityLabel={length ? `Alerts, ${length} new` : 'Alerts'}><b.Ionicons name="notifications-outline" size={21} color="#fff"/>{length ? <H1 style={[
        le.alertDot,
        {
            backgroundColor: v.BRAND.volt,
            borderColor: v.bandFor(color)
        }
    ]}/> : null}</S1><S1 onPress={()=>{
        V();
        setEt(true);
    }} style={le.iconBtn} accessibilityLabel="Your profile"><b.Ionicons name="person-circle-outline" size={24} color="#fff"/></S1></H1><D1 horizontal showsHorizontalScrollIndicator={false} style={{
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center'
    }} contentContainerStyle={le.schools}>{schools.map((e)=>{
        const t = !!team && H.schoolKey(e) === H.schoolKey(team) && !k;
        const o = H.sportOf(st?.team.id ?? '') === 'basketball' ? 'Basketball' : 'Football';
        return <S1 key={e.id} onPress={()=>{
            var o;
            V();
            if (t && Dt) {
                setVisible(true);
            } else {
                o = e.id;
                V();
                Ye.setActive(o);
                setW(null);
                setK(false);
                setUe(null);
                setPe(null);
            }
        }} accessibilityRole="tab" accessibilityState={{
            selected: t
        }} accessibilityLabel={t && Dt ? `${H.schoolName(e.name)}, ${o}. Change sport` : H.schoolName(e.name)} style={[
            le.school,
            {
                backgroundColor: t ? '#fff' : 'rgba(255,255,255,0.13)'
            }
        ]}>{t ? null : <H1 style={[
            le.teamDot,
            {
                backgroundColor: v.headFor(e.color)
            }
        ]}/>}<F1 style={[
            le.schoolText,
            {
                color: t ? e.color : 'rgba(255,255,255,0.86)'
            }
        ]} numberOfLines={1}>{e.short}</F1>{t && Dt ? <><F1 style={[
            le.schoolSport,
            {
                color: v.alpha(e.color, 0.85)
            }
        ]} numberOfLines={1}>{o}</F1><b.Ionicons name="chevron-down" size={14} color={e.color}/></> : null}</S1>;
    })}<S1 onPress={()=>{
        V();
        setXe(true);
    }} style={le.addTeam} accessibilityLabel="Add or remove teams"><b.Ionicons name="add" size={20} color="#fff"/></S1></D1></g.LinearGradient><H1 style={{
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center'
    }}>{ft ? <N.SectionTabs tabs={tabs} c={e} accent={v.inkFor(color, e)} value={k || w ? '' : i === 'pod' || i === 'radio' ? 'listen' : i === 'talk' ? 'social' : i} onChange={(e)=>{
        V();
        setI(e);
        setW(null);
        setK(false);
        setUe(null);
        setPe(null);
    }}/> : null}</H1><H1 style={[
        le.hairline,
        {
            backgroundColor: e.line
        }
    ]}/></H1><N.MiniPlayer bottom={Math.max(n.bottom, 8) + 8}/><N.SearchSheet open={$e} onClose={()=>set$e(false)} feed={ft} onPlayer={(e)=>{
        setI('players');
        onPick(e);
    }}/><QComponent item={U} color={U ? schools.find((e)=>e.id === U.team)?.color ?? color : color} onClose={()=>setU(null)} saved={!!U && isSaved(U.id)} onSave={()=>U && onSave(U)}/><W.AlertsSheet open={Ne} onClose={()=>setNe(false)} alerts={alerts} A={A_1} teams={Ye.followed} onPlayer={(e, t)=>{
        setNe(false);
        Ye.setActive(e);
        setI('all');
        onPick(t);
    }}/><A1 visible={visible} transparent animationType="fade" onRequestClose={()=>setVisible(false)}><S1 style={c.absoluteFill} onPress={()=>setVisible(false)} accessibilityLabel="Close sport menu"/><H1 pointerEvents="box-none" style={{
        position: 'absolute',
        top: se - 4,
        left: 0,
        right: 0,
        alignItems: 'center'
    }}><H1 pointerEvents="box-none" style={{
        width: '100%',
        maxWidth: 720
    }}><H1 style={[
        le.menu,
        {
            backgroundColor: e.surface,
            borderColor: e.line
        }
    ]}>{[
        'football',
        'basketball'
    ].map((t)=>{
        const o = H.sportOf(st?.team.id ?? '') === t;
        return <S1 key={t} onPress={()=>{
            var e;
            V();
            setJe(e = t);
            j.setItem('bl.sport', e).catch(()=>{});
            setVisible(false);
        }} style={({ pressed })=>[
                le.menuRow,
                pressed && {
                    backgroundColor: e.surface2
                }
            ]} accessibilityRole="menuitem" accessibilityState={{
            selected: o
        }}><b.Ionicons name={t === 'football' ? 'american-football' : 'basketball'} size={18} color={o ? color : e.muted}/><F1 style={[
            le.menuText,
            {
                color: e.fg,
                fontFamily: o ? v.fonts.bodyBold : v.fonts.bodyMedium
            }
        ]}>{t === 'football' ? 'Football' : 'Basketball'}</F1>{o ? <b.Ionicons name="checkmark" size={18} color={color}/> : null}</S1>;
    })}</H1></H1></H1></A1><Oe1Component open={be} players={ft?.players ?? []} items={items} color={color} onClose={()=>setBe(false)} onPick={(e)=>{
        V();
        setPe(e);
        setBe(false);
    }}/><ZComponent open={ie} onClose={()=>setIe(false)} feed={Ye}/><XComponent open={et} account={Qe.account} teams={Ye.followed.filter((e, t, o)=>o.findIndex((t)=>H.schoolKey(t) === H.schoolKey(e)) === t)} savedCount={G.length} onClose={()=>setEt(false)} onEditTeams={()=>{
        setEt(false);
        setXe(true);
    }} onSaved={()=>{
        setEt(false);
        setK(true);
        setW(null);
    }} onSignOut={()=>{
        setEt(false);
        Qe.signOut();
        Ye.setFollowedList([]);
    }}/></H1>;
}
function KComponent({ feed, name, c: c_1, count, onClear, following, onFollow }) {
    const c = feed.players.find((e)=>e.name === name);
    const color = feed.team.color;
    const [p, setP] = t.useState(false);
    const x = [
        c?.position || c?.pos,
        c?.year,
        [
            c?.height,
            c?.weight
        ].filter(Boolean).join(', '),
        c?.hometown
    ].filter(Boolean);
    return <H1 style={[
        le.playerCard,
        {
            backgroundColor: c_1.surface,
            borderColor: c_1.line
        }
    ]}><g.LinearGradient colors={[
        color,
        v.bandFor(color)
    ]} start={{
        x: 0,
        y: 0
    }} end={{
        x: 1,
        y: 1
    }} style={le.playerBand}><S1 onPress={onClear} hitSlop={10} style={le.playerBack}><b.Ionicons name="chevron-back" size={16} color="#fff"/><F1 style={le.playerBackText}>All players</F1></S1><H1 style={{
        alignItems: 'flex-end',
        gap: 6
    }}><S1 onPress={onFollow} accessibilityLabel={following ? `Stop alerts for ${name}` : `Get alerts for ${name}`} style={[
        le.followPlayer,
        {
            backgroundColor: following ? '#fff' : 'rgba(0,0,0,0.22)'
        }
    ]}><b.Ionicons name={following ? 'notifications' : 'notifications-outline'} size={14} color={following ? color : '#fff'}/><F1 style={[
        le.playerBackText,
        {
            color: following ? color : '#fff'
        }
    ]}>{following ? 'Alerts on' : 'Alerts'}</F1></S1><F1 style={le.playerNum}>{c?.num ?? ''}</F1></H1></g.LinearGradient><H1 style={le.playerBody}><H1 style={[
        le.headshot,
        {
            backgroundColor: c_1.surface2,
            borderColor: c_1.surface
        }
    ]}>{c?.photo && !p ? <N1 source={{
        uri: c.photo
    }} style={{
        width: '100%',
        height: '100%'
    }} resizeMode="cover" onError={()=>setP(true)}/> : <F1 style={[
        le.headshotInit,
        {
            color
        }
    ]}>{C.initials(name)}</F1>}</H1><F1 style={[
        le.playerName,
        {
            color: c_1.fg
        }
    ]}>{name}</F1><F1 style={[
        le.playerFacts,
        {
            color: c_1.muted
        }
    ]}>{x.join('  ·  ')}</F1><F1 style={[
        le.playerFacts,
        {
            color: c_1.muted,
            marginTop: 2
        }
    ]}>{count ? `${count} stories, videos and posts in the last 10 days` : 'No stories mention him in the last 10 days'}</F1>{c?.socials?.length ? <H1 style={le.socialRow}>{c.socials.map((e)=><S1 key={e.url} onPress={()=>L.openLink(e.url)} style={[
            le.socialBtn,
            {
                backgroundColor: c_1.surface2
            }
        ]}><b.Ionicons name={U(e.platform)} size={15} color={c_1.fg}/><F1 style={[
            le.socialBtnText,
            {
                color: c_1.fg
            }
        ]}>{e.handle ? `@${e.handle}` : e.platform}</F1></S1>)}</H1> : null}</H1></H1>;
}
function U(platform) {
    const t = platform.toLowerCase();
    if (t.includes('insta')) {
        return 'logo-instagram';
    }
    if (t.includes('tiktok')) {
        return 'logo-tiktok';
    }
    if (t === 'x' || t.includes('twitter')) {
        return 'logo-twitter';
    }
    if (t.includes('youtube')) {
        return 'logo-youtube';
    }
    return 'link';
}
function Q1Component({ c, title, right }) {
    return <H1 style={le.section}><F1 style={[
        le.sectionTitle,
        {
            color: c.fg
        }
    ]}>{title}</F1><F1 style={[
        le.sectionRight,
        {
            color: c.muted
        }
    ]}>{right}</F1></H1>;
}
function YComponent({ c, bold, text }) {
    return <H1 style={[
        le.banner,
        {
            backgroundColor: c.surface2
        }
    ]}><F1 style={[
        le.bannerText,
        {
            color: c.muted
        }
    ]}><F1 style={{
        color: c.fg,
        fontFamily: v.fonts.bodySemi
    }}>{bold}</F1>{text}</F1></H1>;
}
function QComponent({ item, color, onClose, saved, onSave }) {
    const r = v.usePalette();
    const d = y.useSafeAreaInsets();
    if (!item) {
        return null;
    }
    const c = item.show ?? item.source;
    const u = {
        news: 'Read at',
        video: 'Watch on',
        pod: 'Listen on',
        radio: 'Listen on',
        social: 'Open on',
        board: 'Open on',
        sponsor: ''
    }[item.kind];
    const g = item.kind === 'video' ? 'YouTube' : item.kind === 'pod' || item.kind === 'radio' ? item.url.includes('apple.com') ? 'Apple Podcasts' : 'the show page' : item.kind === 'social' ? item.source.split(' on ').pop() : item.source;
    const color_1 = T.accentFor(color, r, 0.5);
    return <A1 visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}><H1 style={[
        le.sheet,
        {
            backgroundColor: r.surface,
            paddingBottom: d.bottom + 24
        },
        false
    ]}><H1 style={le.sheetTop}><H1 style={[
        le.grab,
        {
            backgroundColor: r.surface2
        }
    ]}/><S1 onPress={onClose} style={[
        le.close,
        {
            backgroundColor: r.surface2
        }
    ]} accessibilityLabel="Close"><b.Ionicons name="close" size={18} color={r.fg}/></S1></H1><H1 style={le.srcRow}><T.SourceLogo name={c} size={24} color={item.kind === 'pod' || item.kind === 'social' ? color : undefined}/><F1 style={[
        le.srcName,
        {
            color: r.fg
        }
    ]} numberOfLines={1}>{c}</F1><F1 style={{
        color: r.muted,
        fontFamily: v.fonts.body
    }}>· {C.timeAgo(item.at)} ago</F1></H1><F1 style={[
        le.sheetTitle,
        {
            color: r.fg
        }
    ]}>{item.title}</F1><T.PlayerTags names={item.players} color={color} c={r}/>{item.summary ? <H1 style={[
        le.ai,
        {
            backgroundColor: v.alpha(color, r.dark ? 0.18 : 0.08)
        }
    ]}><H1 style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    }}><b.Ionicons name="sparkles" size={12} color={color_1}/><F1 style={[
        le.aiLabel,
        {
            color: color_1
        }
    ]}>QUICK SUMMARY</F1></H1><F1 style={[
        le.aiText,
        {
            color: r.fg
        }
    ]}>{item.summary}</F1></H1> : null}<H1 style={le.actions}><S1 onPress={()=>i.openURL(item.url)} style={({ pressed })=>[
            le.primary,
            {
                backgroundColor: r.fg,
                opacity: pressed ? 0.85 : 1
            }
        ]}><F1 style={[
        le.primaryText,
        {
            color: r.bg
        }
    ]} numberOfLines={1}>{u} {g}</F1><b.Ionicons name="arrow-up-outline" size={16} color={r.bg} style={{
        transform: [
            {
                rotate: '45deg'
            }
        ]
    }}/></S1><S1 onPress={onSave} style={[
        le.secondary,
        {
            backgroundColor: saved ? color : r.surface2
        }
    ]} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}><b.Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? '#fff' : r.fg}/></S1></H1><F1 style={[
        le.fine,
        {
            color: r.muted
        }
    ]}>Diehard links to the original source. The full story always lives with the outlet that made it.</F1></H1></A1>;
}
function XComponent({ open, account, teams, savedCount, onClose, onEditTeams, onSaved, onSignOut }) {
    const c = v.usePalette();
    const u = y.useSafeAreaInsets();
    if (!open) {
        return null;
    }
    const g = account?.provider === 'apple' ? 'Signed in with Apple' : account?.provider === 'google' ? 'Signed in with Google' : 'Signed in with email';
    return <A1 visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}><H1 style={[
        le.sheet,
        {
            backgroundColor: c.surface,
            paddingBottom: u.bottom + 24
        },
        false
    ]}><H1 style={le.sheetTop}><H1 style={[
        le.grab,
        {
            backgroundColor: c.surface2
        }
    ]}/><S1 onPress={onClose} style={[
        le.close,
        {
            backgroundColor: c.surface2
        }
    ]} accessibilityLabel="Close"><b.Ionicons name="close" size={18} color={c.fg}/></S1></H1><F1 style={[
        le.sheetTitle,
        {
            color: c.fg,
            marginTop: 0
        }
    ]}>{account?.name ?? 'Your profile'}</F1><F1 style={{
        color: c.muted,
        fontFamily: v.fonts.body,
        marginTop: 4
    }}>{g}</F1><H1 style={[
        le.section,
        {
            marginTop: 22
        }
    ]}><F1 style={[
        le.sectionTitle,
        {
            color: c.fg,
            fontSize: 16
        }
    ]}>Your teams</F1><S1 onPress={onEditTeams} hitSlop={10}><F1 style={[
        le.link,
        {
            color: c.fg
        }
    ]}>Edit</F1></S1></H1><H1 style={{
        gap: 8,
        marginTop: 10
    }}>{teams.map((e)=><H1 key={e.id} style={le.trow}><H1 style={[
            le.tmark,
            {
                backgroundColor: e.color
            }
        ]}><F1 style={le.chipMarkText}>{e.short.slice(0, 4)}</F1></H1><F1 style={[
            le.srcName,
            {
                color: c.fg
            }
        ]}>{H.schoolName(e.name)}</F1></H1>)}</H1><S1 onPress={onSaved} style={[
        le.profileRow,
        {
            borderColor: c.line
        }
    ]}><b.Ionicons name="bookmark-outline" size={18} color={c.fg}/><F1 style={[
        le.srcName,
        {
            color: c.fg,
            flex: 1
        }
    ]}>Saved stories</F1><F1 style={{
        color: c.muted,
        fontFamily: v.fonts.mono
    }}>{savedCount}</F1></S1><S1 onPress={onSignOut} style={[
        le.profileRow,
        {
            borderColor: c.line
        }
    ]}><b.Ionicons name="log-out-outline" size={18} color={c.fg}/><F1 style={[
        le.srcName,
        {
            color: c.fg,
            flex: 1
        }
    ]}>Sign out</F1></S1><F1 style={[
        le.fine,
        {
            color: c.muted
        }
    ]}>Diehard is an unofficial fan app. It is not affiliated with any team, school or league.</F1></H1></A1>;
}
function ZComponent({ open, onClose, feed }) {
    const i = v.usePalette();
    const r = y.useSafeAreaInsets();
    const [c, setC] = t.useState('');
    const [p, setP] = t.useState('');
    const j = p || feed.leagues[0]?.id || '';
    t.useEffect(()=>{
        if (open && j) {
            feed.loadLeague(j);
        }
    }, [
        open,
        j
    ]);
    const w = c.trim() ? Object.values(feed.leagueTeams).flat() : feed.leagueTeams[j] ?? [];
    const S = c.trim().toLowerCase();
    const k = w.filter((e)=>!S || `${e.name} ${e.city} ${e.short}`.toLowerCase().includes(S)).slice(0, 80);
    return <A1 visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}><H1 style={[
        le.sheet,
        {
            backgroundColor: i.surface,
            paddingBottom: 0
        },
        false
    ]}><H1 style={le.sheetTop}><H1 style={[
        le.grab,
        {
            backgroundColor: i.surface2
        }
    ]}/><S1 onPress={onClose} style={[
        le.close,
        {
            backgroundColor: i.surface2
        }
    ]} accessibilityLabel="Close"><b.Ionicons name="close" size={18} color={i.fg}/></S1></H1><F1 style={[
        le.sheetTitle,
        {
            color: i.fg,
            marginTop: 0
        }
    ]}>Follow teams</F1><H1 style={[
        le.search,
        {
            backgroundColor: i.surface2
        }
    ]}><b.Ionicons name="search" size={16} color={i.muted}/><U1 value={c} onChangeText={setC} placeholder="Search teams" placeholderTextColor={i.muted} style={[
        le.searchInput,
        {
            color: i.fg
        }
    ]} autoCorrect={false}/></H1>{!c.trim() && <D1 horizontal showsHorizontalScrollIndicator={false} style={{
        flexGrow: 0,
        marginHorizontal: -20
    }} contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 6
    }}>{feed.leagues.map((e)=>{
        const t = e.id === j;
        return <S1 key={e.id} onPress={()=>{
            V();
            setP(e.id);
        }} style={[
            le.leagueChip,
            {
                backgroundColor: t ? i.fg : i.surface2
            }
        ]}><F1 style={[
            le.chipText,
            {
                color: t ? i.bg : i.fg,
                fontSize: 13
            }
        ]}>{e.name}</F1><F1 style={[
            le.tabCount,
            {
                color: t ? i.bg : i.muted
            }
        ]}>{e.teams}</F1></S1>;
    })}</D1>}<L1 data={k} keyExtractor={(e)=>e.id} keyboardShouldPersistTaps="handled" contentContainerStyle={{
        paddingBottom: r.bottom + 24
    }} ListEmptyComponent=<F1 style={[
        le.empty,
        {
            color: i.muted
        }
    ]}>{w.length ? 'No team matches that search.' : feed.live ? 'Loading teams…' : 'No teams here yet.'}</F1> ListFooterComponent=<F1 style={[
        le.fine,
        {
            color: i.muted
        }
    ]}>Teams marked Auto collect sources automatically. Custom teams have hand-picked podcasts, channels and outlets.</F1> renderItem={({ item })=>{
        o = item.id;
        const t = feed.followed.some((e)=>e.id === o);
        var o;
        return <S1 onPress={()=>{
            V();
            if (t) {
                feed.unfollow(item.id);
            } else {
                feed.follow(item);
            }
        }} style={le.trow} accessibilityLabel={t ? `Unfollow ${item.name}` : `Follow ${item.name}`}><H1 style={[
            le.tmark,
            {
                backgroundColor: item.color
            }
        ]}><F1 style={le.chipMarkText}>{(item.short || C.initials(item.name)).slice(0, 4)}</F1></H1><H1 style={{
            flex: 1,
            minWidth: 0
        }}><F1 style={[
            le.srcName,
            {
                color: i.fg
            }
        ]} numberOfLines={1}>{item.name}</F1><F1 style={{
            color: i.muted,
            fontFamily: v.fonts.body,
            fontSize: 12
        }} numberOfLines={1}>{[
            item.conference,
            item.mode === 'auto' ? 'Auto' : 'Custom'
        ].filter(Boolean).join(' · ')}</F1></H1><H1 style={[
            le.followBtn,
            {
                backgroundColor: t ? i.surface2 : i.fg
            }
        ]}><F1 style={[
            le.followText,
            {
                color: t ? i.fg : i.bg
            }
        ]}>{t ? 'Following' : 'Follow'}</F1></H1></S1>;
    }}/></H1></A1>;
}
function Ee1Component({ c: c_1, color, sort, topic, topicsOpen, topics, byPlayer, showPlayer, onSort, onTopics, onTopic, onPlayer }) {
    const y = topic ? D.TOPICS.find((e)=>e.id === topic)?.label : null;
    const X = ({ on, icon, label, onPress, close, a11y })=><S1 onPress={onPress} accessibilityLabel={a11y} accessibilityState={{
            selected: on
        }} style={[
            le.fchip,
            {
                backgroundColor: on ? c_1.fg : c_1.surface,
                borderColor: on ? 'transparent' : c_1.line
            }
        ]}><b.Ionicons name={icon} size={14} color={on ? c_1.bg : c_1.fg}/><F1 style={[
            le.fchipText,
            {
                color: on ? c_1.bg : c_1.fg
            }
        ]} numberOfLines={1}>{label}</F1>{close ? <b.Ionicons name="close" size={14} color={on ? c_1.bg : c_1.muted}/> : null}</S1>;
    return <H1 style={{
        marginTop: 10
    }}><D1 horizontal showsHorizontalScrollIndicator={false} style={{
        marginHorizontal: -16
    }} contentContainerStyle={le.frow}><X on={sort === 'latest'} icon="time-outline" label="Latest" onPress={()=>onSort('latest')} a11y="Sort by newest"/><X on={sort === 'trending'} icon="flame-outline" label="Trending" onPress={()=>onSort('trending')} a11y="Sort by trending"/><H1 style={[
        le.fdiv,
        {
            backgroundColor: c_1.line
        }
    ]}/>{showPlayer && <X on={!!byPlayer} icon="person-outline" label={byPlayer ?? 'Player'} close={!!byPlayer} onPress={onPlayer} a11y={byPlayer ? `Clear player filter ${byPlayer}` : 'Filter by player'}/>}<S1 onPress={onTopics} accessibilityLabel={topic ? `Clear topic ${y}` : 'Filter by topic'} style={[
        le.fchip,
        {
            backgroundColor: topic ? c_1.fg : c_1.surface,
            borderColor: topic ? 'transparent' : c_1.line
        }
    ]}><b.Ionicons name="pricetags-outline" size={14} color={topic ? c_1.bg : c_1.fg}/><F1 style={[
        le.fchipText,
        {
            color: topic ? c_1.bg : c_1.fg
        }
    ]}>{y ?? 'Topic'}</F1><b.Ionicons name={topic ? 'close' : topicsOpen ? 'chevron-up' : 'chevron-down'} size={14} color={topic ? c_1.bg : c_1.muted}/></S1></D1>{topicsOpen && !topic ? <H1 style={le.topicWrap}>{topics.length ? topics.map((o)=><S1 key={o.id} onPress={()=>onTopic(o.id)} style={[
            le.topic,
            {
                backgroundColor: v.alpha(color, c_1.dark ? 0.22 : 0.09)
            }
        ]}><F1 style={[
            le.topicText,
            {
                color: c_1.fg
            }
        ]}>{o.label}</F1><F1 style={[
            le.tabCount,
            {
                color: c_1.muted
            }
        ]}>{o.count}</F1></S1>) : <F1 style={[
        le.fine,
        {
            color: c_1.muted,
            marginTop: 12
        }
    ]}>No topics to sort by here yet.</F1>}</H1> : null}</H1>;
}
function Te1Component({ c, color, value, onChange, options }) {
    return <H1 style={[
        le.seg,
        {
            backgroundColor: c.surface2
        }
    ]}>{options.map((n)=>{
        const i = n.key === value;
        return <S1 key={n.key} onPress={()=>onChange(n.key)} accessibilityState={{
            selected: i
        }} style={[
            le.segBtn,
            i && {
                backgroundColor: c.surface,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: {
                    width: 0,
                    height: 2
                }
            }
        ]}>{n.icon ? <b.Ionicons name={n.icon} size={14} color={i ? color : c.muted}/> : null}<F1 style={[
            le.segText,
            {
                color: i ? c.fg : c.muted
            }
        ]} numberOfLines={1}>{n.label}</F1><F1 style={[
            le.tabCount,
            {
                color: c.muted
            }
        ]}>{n.count}</F1></S1>;
    })}</H1>;
}
function Oe1Component({ open, players, items, color, onClose, onPick }) {
    const g = v.usePalette();
    const p = y.useSafeAreaInsets();
    const [x, setX] = t.useState('');
    if (!open) {
        return null;
    }
    const w = new Map;
    for (const e of items){
        for (const t of e.players){
            w.set(t, (w.get(t) || 0) + 1);
        }
    }
    const S = x.trim().toLowerCase();
    const k = players.filter((e)=>!S || `${e.name} ${e.num ?? ''} ${e.position ?? e.pos}`.toLowerCase().includes(S)).sort((e, t)=>(w.get(t.name) || 0) - (w.get(e.name) || 0) || (e.num ?? 999) - (t.num ?? 999));
    return <A1 visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}><H1 style={[
        le.sheet,
        {
            backgroundColor: g.surface,
            paddingBottom: 0
        },
        false
    ]}><H1 style={le.sheetTop}><H1 style={[
        le.grab,
        {
            backgroundColor: g.surface2
        }
    ]}/><S1 onPress={onClose} style={[
        le.close,
        {
            backgroundColor: g.surface2
        }
    ]} accessibilityLabel="Close"><b.Ionicons name="close" size={18} color={g.fg}/></S1></H1><F1 style={[
        le.sheetTitle,
        {
            color: g.fg,
            marginTop: 0
        }
    ]}>Filter by player</F1><H1 style={[
        le.search,
        {
            backgroundColor: g.surface2
        }
    ]}><b.Ionicons name="search" size={16} color={g.muted}/><U1 value={x} onChangeText={setX} placeholder="Name, number or position" placeholderTextColor={g.muted} style={[
        le.searchInput,
        {
            color: g.fg
        }
    ]} autoCorrect={false}/></H1><L1 data={k} keyExtractor={(e)=>e.name} keyboardShouldPersistTaps="handled" contentContainerStyle={{
        paddingBottom: p.bottom + 24
    }} renderItem={({ item })=>{
        const t = w.get(item.name) || 0;
        return <S1 onPress={()=>onPick(item.name)} style={le.trow} accessibilityLabel={`Show ${item.name}`}><H1 style={[
            le.tmark,
            {
                backgroundColor: g.surface2,
                overflow: 'hidden'
            }
        ]}>{item.photo ? <N1 source={{
            uri: item.photo
        }} style={{
            width: '100%',
            height: '100%'
        }}/> : <F1 style={[
            le.chipMarkText,
            {
                color
            }
        ]}>{C.initials(item.name)}</F1>}</H1><H1 style={{
            flex: 1,
            minWidth: 0
        }}><F1 style={[
            le.srcName,
            {
                color: g.fg
            }
        ]} numberOfLines={1}>{item.name}</F1><F1 style={{
            color: g.muted,
            fontFamily: v.fonts.body,
            fontSize: 12
        }} numberOfLines={1}>{[
            item.num != null ? `#${item.num}` : '',
            item.position || item.pos
        ].filter(Boolean).join(' · ')}</F1></H1><F1 style={[
            le.tabCount,
            {
                color: t ? g.fg : g.muted
            }
        ]}>{t ? `${t} here` : '—'}</F1></S1>;
    }}/></H1></A1>;
}
const le = c.create({
    headerWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden'
    },
    hairline: {
        height: c.hairlineWidth
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        gap: 2
    },
    schools: {
        gap: 6,
        paddingLeft: 16,
        paddingRight: 16,
        alignItems: 'center',
        paddingTop: 4
    },
    games: {
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
        gap: c.hairlineWidth
    },
    sub: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 50,
        zIndex: 2,
        borderBottomWidth: c.hairlineWidth
    },
    subRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center'
    },
    sportSeg: {
        flex: 1,
        flexDirection: 'row',
        padding: 3,
        borderRadius: 12,
        height: 36
    },
    sportSegBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        borderRadius: 9
    },
    sportSegText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13.5
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 12
    },
    fhead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18
    },
    fgroup: {
        gap: 10
    },
    flabel: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
    },
    fopts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    fopt: {
        paddingHorizontal: 14,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center'
    },
    foptText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14
    },
    fineLink: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14
    },
    schoolSport: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: v.fonts.bodySemi,
        fontSize: 13,
        marginLeft: 6,
        marginRight: 2
    },
    filterCount: {
        position: 'absolute',
        top: 5,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3
    },
    filterCountText: {
        color: '#fff',
        fontFamily: v.fonts.bodyBold,
        fontSize: 10
    },
    menu: {
        marginLeft: 12,
        width: 220,
        borderRadius: 16,
        borderWidth: c.hairlineWidth,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: {
            width: 0,
            height: 8
        },
        elevation: 8
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        height: 46
    },
    menuText: {
        flex: 1,
        fontSize: 15.5
    },
    sortRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 2
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: c.hairlineWidth
    },
    sortText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
    },
    pageTitle: {
        fontFamily: v.fonts.display,
        fontSize: 30,
        letterSpacing: -0.8,
        lineHeight: 34
    },
    alertDot: {
        position: 'absolute',
        top: 9,
        right: 10,
        width: 9,
        height: 9,
        borderRadius: 5,
        borderWidth: 1.5
    },
    school: {
        flexDirection: 'row',
        height: 34,
        paddingHorizontal: 13,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center'
    },
    schoolDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    schoolText: {
        fontFamily: v.fonts.displayBold,
        fontSize: 15,
        letterSpacing: 0.2
    },
    schoolAdd: {
        width: 36,
        paddingHorizontal: 0,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        borderStyle: 'dashed'
    },
    wordmark: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9
    },
    diamond: {
        width: 10,
        height: 10,
        borderRadius: 3,
        transform: [
            {
                rotate: '45deg'
            }
        ]
    },
    wordmarkText: {
        fontFamily: v.fonts.display,
        fontSize: 23,
        letterSpacing: -0.6
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginLeft: -2,
        marginTop: -10
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        borderTopWidth: c.hairlineWidth,
        marginTop: 10
    },
    brandWord: {
        fontFamily: v.fonts.display,
        fontSize: 17,
        color: '#fff',
        letterSpacing: 1.2,
        marginLeft: 12
    },
    teamDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 7,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.85)'
    },
    addTeam: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        borderStyle: 'dashed'
    },
    mark: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: v.BRAND.volt,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16
    },
    markText: {
        fontFamily: v.fonts.display,
        fontSize: 18,
        color: v.BRAND.voltInk,
        marginTop: -1
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rail: {
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        alignItems: 'center'
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 999,
        borderWidth: c.hairlineWidth
    },
    chipMark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipMarkText: {
        color: '#fff',
        fontFamily: v.fonts.display,
        fontSize: 9.5,
        letterSpacing: 0.2
    },
    chipText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14
    },
    beta: {
        fontFamily: v.fonts.bodyBold,
        fontSize: 9.5,
        letterSpacing: 0.8,
        opacity: 0.7
    },
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: 'dashed'
    },
    tabs: {
        paddingHorizontal: 10,
        paddingTop: 8
    },
    tab: {
        paddingHorizontal: 10,
        paddingTop: 8
    },
    tabText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14
    },
    tabCount: {
        fontFamily: v.fonts.mono,
        fontSize: 11
    },
    pills: {
        gap: 8,
        paddingTop: 12,
        paddingRight: 16
    },
    darkPills: {
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 2,
        paddingBottom: 8
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18
    },
    pillText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14
    },
    pillCount: {
        fontFamily: v.fonts.mono,
        fontSize: 11.5
    },
    tabBar: {
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        marginTop: 10
    },
    section: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 26,
        marginBottom: 2,
        paddingHorizontal: 2
    },
    sectionTitle: {
        fontFamily: v.fonts.display,
        fontSize: 19,
        letterSpacing: -0.3
    },
    sectionRight: {
        fontFamily: v.fonts.mono,
        fontSize: 11.5
    },
    banner: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 14
    },
    bannerText: {
        fontFamily: v.fonts.body,
        fontSize: 12.5,
        lineHeight: 18
    },
    fine: {
        fontFamily: v.fonts.body,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 12
    },
    empty: {
        fontFamily: v.fonts.body,
        textAlign: 'center',
        paddingVertical: 36,
        fontSize: 14
    },
    filterHead: {
        marginTop: 16,
        borderRadius: 18,
        borderWidth: c.hairlineWidth,
        padding: 14,
        marginBottom: 6,
        gap: 12
    },
    pnum: {
        fontFamily: v.fonts.display,
        fontSize: 28,
        lineHeight: 28
    },
    pname: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 15
    },
    ppos: {
        fontFamily: v.fonts.body,
        fontSize: 12,
        marginTop: 2
    },
    link: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13.5
    },
    socialRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginTop: 12
    },
    playerCard: {
        marginTop: 16,
        marginBottom: 6,
        borderRadius: 22,
        borderWidth: c.hairlineWidth,
        overflow: 'hidden'
    },
    playerBand: {
        height: 96,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 14
    },
    playerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(0,0,0,0.22)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999
    },
    playerBackText: {
        color: '#fff',
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
    },
    playerNum: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: v.fonts.display,
        fontSize: 34,
        lineHeight: 36
    },
    followPlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999
    },
    bellBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2
    },
    bellBadgeText: {
        color: '#fff',
        fontFamily: v.fonts.bodyBold,
        fontSize: 10
    },
    playerBody: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 18,
        marginTop: -54
    },
    headshot: {
        width: 108,
        height: 108,
        borderRadius: 54,
        borderWidth: 4,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headshotInit: {
        fontFamily: v.fonts.display,
        fontSize: 34
    },
    playerName: {
        fontFamily: v.fonts.display,
        fontSize: 26,
        letterSpacing: -0.6,
        marginTop: 10,
        textAlign: 'center'
    },
    playerFacts: {
        fontFamily: v.fonts.body,
        fontSize: 13.5,
        marginTop: 6,
        textAlign: 'center'
    },
    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 10
    },
    socialBtnText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
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
        maxHeight: '88%'
    },
    sheetTop: {
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 14
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
    srcRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 18
    },
    srcName: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 14,
        flexShrink: 1
    },
    sheetTitle: {
        fontFamily: v.fonts.bodyBold,
        fontSize: 23,
        lineHeight: 29,
        letterSpacing: -0.4,
        marginTop: 12
    },
    ai: {
        borderRadius: 14,
        padding: 14,
        marginTop: 16,
        gap: 6
    },
    aiLabel: {
        fontFamily: v.fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 1
    },
    aiText: {
        fontFamily: v.fonts.body,
        fontSize: 15,
        lineHeight: 22
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20
    },
    primary: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 12
    },
    primaryText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 15.5,
        flexShrink: 1
    },
    secondary: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 14,
        marginTop: 14,
        marginBottom: 8
    },
    searchInput: {
        flex: 1,
        fontFamily: v.fonts.body,
        fontSize: 15.5
    },
    trow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10
    },
    leagueChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 999
    },
    followBtn: {
        paddingHorizontal: 14,
        height: 32,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center'
    },
    followText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
    },
    tmark: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sportBar: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: 999,
        gap: 2,
        height: 40,
        alignItems: 'center'
    },
    sportBtn: {
        height: 34,
        minWidth: 34,
        paddingHorizontal: 9,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },
    sportText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13.5
    },
    kchip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1
    },
    frow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 2
    },
    fchip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: c.hairlineWidth,
        maxWidth: 220
    },
    fchipText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13,
        flexShrink: 1
    },
    fdiv: {
        width: c.hairlineWidth,
        height: 20,
        marginHorizontal: 2
    },
    topicWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    topic: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 10
    },
    topicText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13
    },
    seg: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 4,
        marginTop: 12,
        gap: 4
    },
    segBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        height: 36,
        borderRadius: 10,
        paddingHorizontal: 6,
        minWidth: 0
    },
    segText: {
        fontFamily: v.fonts.bodySemi,
        fontSize: 13,
        flexShrink: 1
    }
});

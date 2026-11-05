// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Image as L, Pressable as I, ScrollView as O, StyleSheet as a, Text as S1, View as N } from 'react-native';
import t from 'react';






import * as r from '@expo/vector-icons';
import * as c from './data';
import * as u from './theme';
import * as f from './links';
import * as p from './sports';

export const clipKind = function(e) {
    if (e.kind !== 'video') {
        return null;
    }
    const e_title = e.title;
    if (b.test(e_title) || b.test(e.source)) {
        return null;
    }
    if (g.test(e_title)) {
        return 'postgame';
    }
    if (y.test(e_title)) {
        return 'highlights';
    }
    if (v.test(e_title)) {
        return 'pregame';
    }
    if (x.test(e_title)) {
        return 'interviews';
    }
    return null;
};
export const useEspnClips = function(e) {
    const [l, setL] = t.useState(null);
    t.useEffect(()=>{
        setL(null);
        if (!e) {
            return;
        }
        const t = j[p.leagueOf(e)];
        const l = e.match(/(\d+)$/)?.[1];
        if (!t || !l) {
            return void setL([]);
        }
        let o = false;
        const a = async ()=>{
            try {
                const e = (await Promise.all([
                    '',
                    '?seasontype=3'
                ].map((e)=>fetch(`${w}/${t}/teams/${l}/schedule${e}`).then((e)=>e.json()).catch(()=>null)))).flatMap((e)=>e?.events ?? []).filter((e)=>[
                        'in',
                        'post'
                    ].includes(e.competitions?.[0]?.status?.type?.state)).sort((e, t)=>Date.parse(t.date) - Date.parse(e.date)).slice(0, 3);
                const a = [];
                for (const l of e){
                    const e = await fetch(`${w}/${t}/summary?event=${l.id}`).then((e)=>e.json()).catch(()=>null);
                    const clips = (e?.videos ?? []).map((e)=>({
                            id: String(e.id),
                            title: e.headline ?? '',
                            secs: e.duration ?? 0,
                            thumb: e.thumbnail,
                            url: e.links?.web?.href
                        })).filter((e)=>e.url && e.title);
                    if (!clips.length) {
                        continue;
                    }
                    const o = l.competitions?.[0];
                    const score = (o?.competitors ?? []).map((e)=>`${e.team?.abbreviation ?? ''} ${e.score?.displayValue ?? e.score ?? ''}`).join(', ');
                    a.push({
                        id: String(l.id),
                        name: l.shortName || l.name,
                        date: Date.parse(l.date),
                        live: o?.status?.type?.state === 'in',
                        score,
                        clips
                    });
                    if (a.length >= 2) {
                        break;
                    }
                }
                if (!o) {
                    setL(a);
                }
            } catch  {
                if (!o) {
                    setL([]);
                }
            }
        };
        a();
        const s = setInterval(a, 180000);
        return ()=>{
            o = true;
            clearInterval(s);
        };
    }, [
        e
    ]);
    return l;
};
export const GameClipsRail = function({ game, c: c_1 }) {
    return <N style={{
        marginTop: 14
    }}><N style={S.head}>{game.live ? <N style={[
        S.live,
        {
            backgroundColor: c_1.live
        }
    ]}><S1 style={S.liveText}>LIVE</S1></N> : null}<S1 style={[
        S.title,
        {
            color: c_1.fg
        }
    ]} numberOfLines={1}>{game.score || game.name}</S1><S1 style={[
        S.meta,
        {
            color: c_1.muted
        }
    ]}>{game.live ? 'now' : c.timeAgo(game.date)}</S1></N><O horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
        gap: 10,
        paddingRight: 16
    }} style={{
        marginHorizontal: -2
    }}>{game.clips.map((e)=><I key={e.id} onPress={()=>f.openLink(e.url)} style={({ pressed })=>[
                S.card,
                {
                    backgroundColor: c_1.surface
                },
                pressed && {
                    opacity: 0.85
                }
            ]} accessibilityRole="link" accessibilityLabel={`${e.title}, ${k(e.secs)}, opens ESPN`}><N style={[
            S.thumb,
            {
                backgroundColor: c_1.surface2
            }
        ]}>{e.thumb ? <L source={{
            uri: e.thumb
        }} style={a.absoluteFill} resizeMode="cover"/> : null}<N style={S.play}><r.Ionicons name="play" size={16} color="#0D1017" style={{
            marginLeft: 2
        }}/></N><N style={S.dur}><S1 style={S.durText}>{k(e.secs)}</S1></N></N><S1 style={[
            S.clipTitle,
            {
                color: c_1.fg
            }
        ]} numberOfLines={2}>{e.title}</S1><S1 style={[
            S.meta,
            {
                color: c_1.muted,
                paddingHorizontal: 10,
                paddingBottom: 10
            }
        ]}>ESPN</S1></I>)}</O></N>;
};
export const clipItems = function(e, team) {
    return (e ?? []).flatMap((e)=>e.clips.map((l)=>({
                id: `espn-${l.id}`,
                team,
                kind: 'video',
                source: 'ESPN',
                show: `${e.live ? 'LIVE · ' : ''}${e.score || e.name} \xb7 ESPN`,
                title: l.title,
                url: l.url,
                image: l.thumb,
                at: e.date,
                players: []
            })));
};
const b = /\b(simulation|sim|madden|cfb ?2\d|college football 2\d|ncaa (football )?2\d|ea sports|gameplay|ps5|xbox)\b/i;
const g = /\b(post-?game|after (the )?(win|loss|game)|locker room|reacts? to (the )?(win|loss|victory|defeat))\b/i;
const y = /\b(highlights?|condensed|top plays|best plays|every (touchdown|td|bucket|score)|full game recap|extended recap)\b/i;
const v = /\b(pre-?game|preview|keys to (the )?game|what to watch|game ?week|game ?day|predictions?|matchup|scouting report)\b/i;
const x = /\b(press conference|presser|media (availability|day)|interview|1-on-1|one-on-one|mic'?d up|talks(?! show)|speaks|q&a|sits down|weekly (show|press))\b/i;
const w = 'https://site.api.espn.com/apis/site/v2/sports';
const j = {
    'college-football': 'football/college-football',
    'mens-college-basketball': 'basketball/mens-college-basketball',
    nfl: 'football/nfl',
    nba: 'basketball/nba'
};
const k = (secs)=>`${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;
const S = a.create({
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    title: {
        flex: 1,
        fontFamily: u.fonts.displayBold,
        fontSize: 16
    },
    meta: {
        fontFamily: u.fonts.body,
        fontSize: 12
    },
    live: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5
    },
    liveText: {
        color: '#fff',
        fontFamily: u.fonts.bodyBold,
        fontSize: 10.5,
        letterSpacing: 0.5
    },
    card: {
        width: 220,
        borderRadius: 14,
        overflow: 'hidden'
    },
    thumb: {
        width: 220,
        height: 124,
        justifyContent: 'center',
        alignItems: 'center'
    },
    play: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    dur: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 1
    },
    durText: {
        color: '#fff',
        fontFamily: u.fonts.bodySemi,
        fontSize: 11
    },
    clipTitle: {
        fontFamily: u.fonts.bodySemi,
        fontSize: 13.5,
        lineHeight: 18,
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: 2,
        minHeight: 46
    }
});

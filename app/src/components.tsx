// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Image as O, Pressable as L, StyleSheet as n, Text as I, View as S1 } from 'react-native';
import t from 'react';





import * as c from 'expo-linear-gradient';
import * as f from '@expo/vector-icons';
import * as u from './data';
import * as y from './theme';

export const SponsorCard = function({ team, c }) {
    return <S1 style={[
        s.card,
        s.sponsor,
        {
            borderColor: c.muted
        }
    ]}><S1 style={s.src}><SourceLogo name="AD" color={c.muted}/><I style={[
        s.srcName,
        {
            color: c.muted
        }
    ]}>Presented by a local partner</I><S1 style={{
        flex: 1
    }}/><BComponent label="Sponsor" bg={c.surface2} fg={c.muted}/></S1><I style={[
        s.title,
        {
            color: c.fg
        }
    ]}>Your business here, in front of {team.name.replace(' Football', '')} fans every day.</I><I style={[
        s.summary,
        {
            color: c.muted
        }
    ]}>One sponsor per team. No betting ads.</I></S1>;
};
export const FeedCard = function({ item, color, c: c_1, onPress, lead }) {
    const b = [
        s.card,
        {
            backgroundColor: c_1.surface,
            borderColor: c_1.line
        }
    ];
    if (lead && item.image) {
        return <L onPress={onPress} style={({ pressed })=>[
                ...b,
                s.noPad,
                pressed && s.pressed
            ]}><S1 style={[
            s.leadImg,
            {
                backgroundColor: color
            }
        ]}><ZComponent uri={item.image} style={null}/><c.LinearGradient colors={[
            'transparent',
            'rgba(0,0,0,0.25)',
            'rgba(0,0,0,0.88)'
        ]} locations={[
            0,
            0.4,
            1
        ]} style={n.absoluteFill}/>{item.kind === 'video' && <S1 style={[
            s.playBig,
            {
                top: 14,
                bottom: undefined
            }
        ]}><f.Ionicons name="play" size={18} color="#0D1017" style={{
            marginLeft: 2
        }}/></S1>}<S1 style={s.leadBody}><I style={s.leadKicker}>TOP STORY · {(item.show ?? item.source).toUpperCase()} · {u.timeAgo(item.at).toUpperCase()}</I><I style={s.leadTitle} numberOfLines={4}>{item.title}</I></S1></S1>{item.players.length ? <S1 style={{
            paddingHorizontal: 14,
            paddingBottom: 14
        }}><PlayerTags names={item.players} color={color} c={c_1}/></S1> : null}</L>;
    }
    if (item.kind === 'video') {
        return <L onPress={onPress} style={({ pressed })=>[
                ...b,
                s.noPad,
                pressed && s.pressed
            ]}><c.LinearGradient colors={[
            y.lift(color, 0.15),
            color,
            '#05070B'
        ]} locations={[
            0,
            0.45,
            1
        ]} start={{
            x: 1,
            y: 0
        }} end={{
            x: 0,
            y: 1
        }} style={s.thumb}><ZComponent uri={item.image} style={null}><c.LinearGradient colors={[
            'transparent',
            'rgba(0,0,0,0.55)'
        ]} style={n.absoluteFill}/></ZComponent>{item.duration ? <S1 style={s.dur}><I style={s.durText}>{item.duration}</I></S1> : null}{!item.image && <I style={s.thumbText}>HIGH{'\n'}LIGHTS</I>}<S1 style={s.playBig}><f.Ionicons name="play" size={18} color="#0D1017" style={{
            marginLeft: 2
        }}/></S1></c.LinearGradient><S1 style={s.pad}><KComponent item={item} color={color} c={c_1}/><I style={[
            s.title,
            {
                color: c_1.fg
            }
        ]} numberOfLines={3}>{item.title}</I><PlayerTags names={item.players} color={color} c={c_1}/></S1></L>;
    }
    if (item.kind === 'pod' || item.kind === 'radio') {
        const n = item.kind === 'radio' ? 'ON\nAIR' : (item.show ?? item.source).split(' ').slice(0, 2).join('\n');
        return <L onPress={onPress} style={({ pressed })=>[
                ...b,
                pressed && s.pressed
            ]}><S1 style={s.podRow}><c.LinearGradient colors={[
            y.lift(color, 0.2),
            item.kind === 'radio' ? '#0F5BB5' : '#111318'
        ]} start={{
            x: 0,
            y: 0
        }} end={{
            x: 1,
            y: 1
        }} style={s.podArt}>{item.image ? <ZComponent uri={item.image} style={{
            borderRadius: 14
        }}/> : <I style={s.podArtText}>{n}</I>}</c.LinearGradient><S1 style={{
            flex: 1,
            minWidth: 0
        }}><KComponent item={item} color={color} c={c_1}/><I style={[
            s.title,
            {
                color: c_1.fg,
                marginTop: 6
            }
        ]} numberOfLines={3}>{item.title}</I></S1></S1><S1 style={s.playerBar}><S1 style={[
            s.pbtn,
            {
                backgroundColor: c_1.fg
            }
        ]}><f.Ionicons name="play" size={13} color={c_1.bg} style={{
            marginLeft: 2
        }}/></S1><TComponent id={item.id} color={color} c={c_1}/>{item.duration ? <I style={[
            s.pdur,
            {
                color: c_1.muted
            }
        ]}>{item.duration}</I> : null}</S1><PlayerTags names={item.players} color={color} c={c_1}/></L>;
    }
    if (item.kind === 'social') {
        return <L onPress={onPress} style={({ pressed })=>[
                ...b,
                pressed && s.pressed
            ]}><KComponent item={item} color={color} c={c_1}/><I style={[
            s.socialText,
            {
                color: c_1.fg
            }
        ]} numberOfLines={5}>{item.title}</I>{item.image ? <S1 style={s.socialImg}><ZComponent uri={item.image} style={{
            borderRadius: 14
        }}/></S1> : null}</L>;
    }
    if (item.image) {
        return <L onPress={onPress} style={({ pressed })=>[
                ...b,
                s.noPad,
                pressed && s.pressed
            ]}><S1 style={[
            s.newsImg,
            {
                backgroundColor: c_1.surface2
            }
        ]}><ZComponent uri={item.image} style={null}/></S1><S1 style={s.pad}><KComponent item={item} color={color} c={c_1}/><I style={[
            s.title,
            {
                color: c_1.fg
            }
        ]}>{item.title}</I>{item.summary ? <I style={[
            s.summary,
            {
                color: c_1.muted
            }
        ]} numberOfLines={2}>{item.summary}</I> : null}<PlayerTags names={item.players} color={color} c={c_1}/></S1></L>;
    }
    return <L onPress={onPress} style={({ pressed })=>[
            ...b,
            pressed && s.pressed
        ]}><KComponent item={item} color={color} c={c_1}/><I style={[
        s.title,
        {
            color: c_1.fg
        }
    ]}>{item.title}</I>{item.summary ? <I style={[
        s.summary,
        {
            color: c_1.muted
        }
    ]} numberOfLines={3}>{item.summary}</I> : null}<PlayerTags names={item.players} color={color} c={c_1}/></L>;
};
export const Masthead = function({ team }) {
    const team_next = team.next;
    const [o, l] = u.countdown(team_next?.date, team_next?.status, /basketball/.test(team.id) ? 'tipoff' : /nhl|hockey/.test(team.id) ? 'puck drop' : 'kickoff');
    const f = team_next?.date ? new Date(team_next.date).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }) : 'Schedule TBA';
    const h = [
        team.conference,
        team.city
    ].filter(Boolean).join(' · ').toUpperCase();
    return <c.LinearGradient colors={[
        y.lift(team.color, 0.18),
        team.color
    ]} start={{
        x: 1,
        y: 0
    }} end={{
        x: 0,
        y: 1
    }} style={s.mast}><c.LinearGradient colors={[
        'transparent',
        'rgba(0,0,0,0.35)'
    ]} style={n.absoluteFill} start={{
        x: 0.3,
        y: 0
    }} end={{
        x: 0,
        y: 1
    }}/><S1 style={s.mastRow}><S1 style={{
        flex: 1
    }}><I style={s.eyebrow}>{h}</I><I style={s.mastTitle}>{team.name}</I>{team.standing ? <I style={s.standing}>{team.standing}</I> : null}</S1>{team.record ? <S1 style={s.record}><I style={s.recordText}>{team.record.replace('-', '–')}</I></S1> : null}</S1>{team_next?.opponent ? <S1 style={s.next}><S1 style={{
        flex: 1,
        minWidth: 0
    }}><I style={s.nextWhen}>NEXT · {f.toUpperCase()}</I><I style={s.nextOpp} numberOfLines={1}>{team_next.home === false ? '@' : 'vs'} {team_next.opponent}</I></S1><S1 style={{
        alignItems: 'flex-end'
    }}><I style={s.cd}>{o}</I><I style={s.cdLabel}>{l.toUpperCase()}</I></S1></S1> : null}</c.LinearGradient>;
};
export const Brief = function({ feed, c }) {
    if (!feed.brief?.length) {
        return null;
    }
    const color = feed.team.color;
    return <S1 style={[
        s.brief,
        {
            backgroundColor: c.surface,
            borderColor: c.line
        }
    ]}><S1 style={s.briefHead}><S1 style={[
        s.spark,
        {
            backgroundColor: y.alpha(color, c.dark ? 0.25 : 0.12)
        }
    ]}><f.Ionicons name="sparkles" size={11} color={accentFor(color, c, 0.5)}/></S1><I style={[
        s.briefLabel,
        {
            color: c.muted
        }
    ]}>YOUR 30-SECOND CATCH-UP</I></S1>{feed.brief.slice(0, 3).map((e)=><S1 key={e} style={s.briefLine}><S1 style={[
            s.diamond,
            {
                backgroundColor: color
            }
        ]}/><I style={[
            s.briefText,
            {
                color: c.fg
            }
        ]}>{e}</I></S1>)}<I style={[
        s.briefMeta,
        {
            color: c.muted
        }
    ]}>Built from {feed.items.length} items across {feed.sources} sources · updated {u.timeAgo(feed.updatedAt)} ago</I></S1>;
};
export const PlayerGrid = function({ players, color, c: c_1, onPick }) {
    const c = players.slice(0, 80);
    return <S1 style={s.grid}>{c.map((e)=><L key={e.name} onPress={()=>onPick(e.name)} style={({ pressed })=>[
                s.pcard,
                {
                    backgroundColor: c_1.surface,
                    borderColor: c_1.line
                },
                pressed && s.pressed
            ]}><S1 style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10
        }}><CComponent uri={e.photo} name={e.name} color={color} c={c_1}/><S1 style={{
            flex: 1,
            minWidth: 0
        }}><I style={[
            s.pname,
            {
                color: c_1.fg
            }
        ]} numberOfLines={2}>{e.name}</I><I style={[
            s.ppos,
            {
                color: c_1.muted
            }
        ]} numberOfLines={1}>{[
            e.num != null ? `#${e.num}` : '',
            e.pos
        ].filter(Boolean).join(' · ')}</I></S1></S1><S1 style={s.meterRow}><I style={[
            s.meterNum,
            {
                color: e.mentions ? c_1.fg : c_1.muted
            }
        ]}>{e.mentions ? `${e.mentions} mention${e.mentions > 1 ? 's' : ''}` : 'No mentions yet'}</I><S1 style={{
            flex: 1
        }}/>{e.socials?.some((e)=>/insta/i.test(e.platform)) ? <f.Ionicons name="logo-instagram" size={14} color={c_1.muted}/> : null}{e.socials?.some((e)=>e.platform === 'X') ? <f.Ionicons name="logo-twitter" size={14} color={c_1.muted}/> : null}</S1></L>)}</S1>;
};
const h = {
    news: 'Article',
    video: 'Video',
    pod: 'Podcast',
    radio: 'Radio',
    social: 'Social'
};
export const accentFor = (e, t, o = 0.45)=>y.inkFor(e, t, o);
function BComponent({ label, bg: backgroundColor, fg: color }) {
    return <S1 style={[
        s.pill,
        {
            backgroundColor
        }
    ]}><I style={[
        s.pillText,
        {
            color
        }
    ]}>{label.toUpperCase()}</I></S1>;
}
export function PlayerTags({ names, color, c }) {
    if (names?.length) {
        return <S1 style={s.tags}>{names.map((e)=><S1 key={e} style={[
                s.tag,
                {
                    backgroundColor: y.alpha(color, c.dark ? 0.22 : 0.1)
                }
            ]}><I style={[
                s.tagText,
                {
                    color: accentFor(color, c, 0.5)
                }
            ]}>{e}</I></S1>)}</S1>;
    }
    return null;
}
export function SourceLogo({ name, size = 22, color }) {
    return <S1 style={[
        s.logo,
        {
            width: size,
            height: size,
            borderRadius: 0.32 * size,
            backgroundColor: color ?? u.sourceColor(name)
        }
    ]}><I style={[
        s.logoText,
        {
            fontSize: 0.42 * size
        }
    ]}>{u.initials(name) || '•'}</I></S1>;
}
const S = {
    X: 'logo-twitter',
    Instagram: 'logo-instagram',
    TikTok: 'logo-tiktok',
    Bluesky: 'at',
    Threads: 'at',
    YouTube: 'logo-youtube'
};
function KComponent({ item, color, c: c_1 }) {
    const l = item.show ?? item.source;
    const n = item.kind === 'social' && /^r\/|reddit/i.test(item.source);
    const c = item.platform ? S[item.platform] : n ? 'logo-reddit' : undefined;
    return <S1 style={s.src}>{c ? <S1 style={[
        s.logo,
        {
            width: 22,
            height: 22,
            borderRadius: 7,
            backgroundColor: n ? '#FF4500' : color
        }
    ]}><f.Ionicons name={c} size={13} color="#fff"/></S1> : <SourceLogo name={l} color={item.kind === 'pod' || item.kind === 'social' ? color : undefined}/>}<I numberOfLines={1} style={[
        s.srcName,
        {
            color: c_1.fg
        }
    ]}>{l}</I><I style={[
        s.srcTime,
        {
            color: c_1.muted
        }
    ]}>· {u.timeAgo(item.at)}</I><S1 style={{
        flex: 1
    }}/><BComponent label={h[item.kind] ?? 'Item'} bg={item.kind === 'radio' ? c_1.live : c_1.surface2} fg={item.kind === 'radio' ? '#fff' : c_1.muted}/></S1>;
}
function TComponent({ id, color, c }) {
    const l = u.waveFor(id);
    const n = Math.floor(0.18 * l.length);
    return <S1 style={s.wave}>{l.map((e, l)=><S1 key={l} style={{
            flex: 1,
            height: `${25 + 75 * e}%`,
            borderRadius: 2,
            backgroundColor: l < n ? color : c.surface2
        }}/>)}</S1>;
}
function ZComponent({ uri, style, children }) {
    const [s, setS] = t.useState(false);
    if (!uri || s) {
        return null;
    }
    return <><O source={{
        uri
    }} style={[
        n.absoluteFill,
        style
    ]} resizeMode="cover" onError={()=>setS(true)}/>{children}</>;
}
function CComponent({ uri, name, color, c }) {
    const [f, setF] = t.useState(false);
    return <S1 style={[
        s.hs,
        {
            backgroundColor: y.alpha(color, c.dark ? 0.3 : 0.12)
        }
    ]}>{uri && !f ? <O source={{
        uri
    }} style={{
        width: '100%',
        height: '100%'
    }} resizeMode="cover" onError={()=>setF(true)}/> : <I style={[
        s.hsInit,
        {
            color: accentFor(color, c, 0.4)
        }
    ]}>{u.initials(name)}</I>}</S1>;
}
export const s = n.create({
    pill: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6
    },
    pillText: {
        fontFamily: y.fonts.bodyBold,
        fontSize: 9.5,
        letterSpacing: 0.7
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10
    },
    tag: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999
    },
    tagText: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 12
    },
    src: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7
    },
    logo: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    logoText: {
        color: '#fff',
        fontFamily: y.fonts.displayBold
    },
    srcName: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 13,
        flexShrink: 1
    },
    srcTime: {
        fontFamily: y.fonts.body,
        fontSize: 13
    },
    card: {
        borderRadius: 18,
        borderWidth: n.hairlineWidth,
        padding: 14,
        overflow: 'hidden'
    },
    noPad: {
        padding: 0
    },
    pad: {
        padding: 14
    },
    pressed: {
        transform: [
            {
                scale: 0.985
            }
        ],
        opacity: 0.92
    },
    sponsor: {
        borderStyle: 'dashed',
        borderWidth: 1,
        backgroundColor: 'transparent'
    },
    title: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 16.5,
        lineHeight: 21.5,
        marginTop: 9,
        letterSpacing: -0.1
    },
    summary: {
        fontFamily: y.fonts.body,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 5
    },
    socialText: {
        fontFamily: y.fonts.body,
        fontSize: 15.5,
        lineHeight: 22,
        marginTop: 10
    },
    socialImg: {
        marginTop: 12,
        aspectRatio: 1,
        borderRadius: 14,
        overflow: 'hidden'
    },
    newsImg: {
        aspectRatio: 1.91,
        width: '100%',
        overflow: 'hidden'
    },
    leadImg: {
        aspectRatio: 1.15,
        width: '100%',
        justifyContent: 'flex-end',
        overflow: 'hidden'
    },
    leadBody: {
        padding: 18,
        gap: 8
    },
    leadKicker: {
        color: 'rgba(255,255,255,0.82)',
        fontFamily: y.fonts.mono,
        fontSize: 10.5,
        letterSpacing: 0.6
    },
    leadTitle: {
        color: '#fff',
        fontFamily: y.fonts.display,
        fontSize: 27,
        lineHeight: 29,
        letterSpacing: -0.6
    },
    thumb: {
        aspectRatio: 1.7777777777777777,
        width: '100%',
        justifyContent: 'flex-end',
        padding: 14,
        overflow: 'hidden'
    },
    thumbText: {
        color: 'rgba(255,255,255,0.94)',
        fontFamily: y.fonts.display,
        fontSize: 40,
        lineHeight: 38,
        letterSpacing: -1.5,
        maxWidth: '75%'
    },
    playBig: {
        position: 'absolute',
        right: 14,
        bottom: 14,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    dur: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6
    },
    durText: {
        color: '#fff',
        fontFamily: y.fonts.monoBold,
        fontSize: 11
    },
    podRow: {
        flexDirection: 'row',
        gap: 12
    },
    podArt: {
        width: 64,
        height: 64,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        overflow: 'hidden'
    },
    podArtText: {
        color: '#fff',
        fontFamily: y.fonts.display,
        fontSize: 12,
        lineHeight: 13,
        textAlign: 'center'
    },
    playerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12
    },
    pbtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center'
    },
    wave: {
        flex: 1,
        height: 22,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
    },
    pdur: {
        fontFamily: y.fonts.mono,
        fontSize: 12
    },
    mast: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        marginTop: 16
    },
    mastRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: y.fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 1.3
    },
    mastTitle: {
        color: '#fff',
        fontFamily: y.fonts.display,
        fontSize: 36,
        lineHeight: 36,
        letterSpacing: -1.2,
        marginTop: 8
    },
    standing: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: y.fonts.bodyMedium,
        fontSize: 13,
        marginTop: 6
    },
    record: {
        backgroundColor: 'rgba(255,255,255,0.16)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10
    },
    recordText: {
        color: '#fff',
        fontFamily: y.fonts.monoBold,
        fontSize: 13
    },
    next: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 18,
        backgroundColor: 'rgba(0,0,0,0.24)',
        borderRadius: 16,
        padding: 14
    },
    nextWhen: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: y.fonts.mono,
        fontSize: 11
    },
    nextOpp: {
        color: '#fff',
        fontFamily: y.fonts.displayBold,
        fontSize: 17,
        marginTop: 3
    },
    cd: {
        color: '#fff',
        fontFamily: y.fonts.monoBold,
        fontSize: 18
    },
    cdLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: y.fonts.mono,
        fontSize: 9.5,
        letterSpacing: 0.8,
        marginTop: 4
    },
    brief: {
        borderRadius: 18,
        borderWidth: n.hairlineWidth,
        padding: 16,
        marginTop: 10,
        gap: 10
    },
    briefHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    spark: {
        width: 20,
        height: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },
    briefLabel: {
        fontFamily: y.fonts.bodyBold,
        fontSize: 11.5,
        letterSpacing: 1
    },
    briefLine: {
        flexDirection: 'row',
        gap: 10
    },
    diamond: {
        width: 6,
        height: 6,
        borderRadius: 1.5,
        marginTop: 8,
        marginLeft: 4,
        transform: [
            {
                rotate: '45deg'
            }
        ]
    },
    briefText: {
        flex: 1,
        fontFamily: y.fonts.body,
        fontSize: 14.5,
        lineHeight: 21
    },
    briefMeta: {
        fontFamily: y.fonts.mono,
        fontSize: 11
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    pcard: {
        width: '48.5%',
        flexGrow: 1,
        borderRadius: 18,
        borderWidth: n.hairlineWidth,
        padding: 12,
        gap: 10
    },
    hs: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    hsInit: {
        fontFamily: y.fonts.display,
        fontSize: 15
    },
    pnum: {
        fontFamily: y.fonts.display,
        fontSize: 30,
        lineHeight: 30
    },
    pname: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 15
    },
    ppos: {
        fontFamily: y.fonts.body,
        fontSize: 12,
        marginTop: 2
    },
    meterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    meter: {
        flex: 1,
        height: 5,
        borderRadius: 5,
        overflow: 'hidden'
    },
    meterNum: {
        fontFamily: y.fonts.mono,
        fontSize: 11.5
    }
});

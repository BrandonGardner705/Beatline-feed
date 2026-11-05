// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Image as O1, Platform, Pressable as L1, Share as n, StyleSheet as s, Text as U, View as C1 } from 'react-native';
import t from 'react';







import * as f from 'expo-linear-gradient';
import * as m from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as h from './data';
import * as y from './theme';
import { EngageBar } from './community';
import * as p from './links';
import * as b from './components';
import * as x from './seen';

export const PostCard = function({ item, color, c, saved, onSave, onPlayer, badge }) {
    const [H, setH] = t.useState(false);
    const L = item.show ?? item.source;
    const D = k[item.kind] ?? k.news;
    const O = /news\.google\.com/.test(item.url) ? '' : p.domainOf(item.url);
    const id = item.kind === 'video' ? p.youTubeId(item.url) : null;
    const $ = x.useSeen(item.id);
    const onPress = ()=>{
        x.markSeen(item.id);
        p.openLink(item.url);
    };
    const color_1 = $ ? c.muted : c.fg;
    item.kind === 'board' || item.kind === 'video' || item.kind === 'pod' || item.kind === 'radio' || item.platform;
    return <C1 style={[
        C.card,
        {
            backgroundColor: c.surface
        }
    ]}><L1 onPress={onPress} style={C.head}><ZComponent item={item} color={color}/><C1 style={{
        flex: 1,
        minWidth: 0
    }}><U style={[
        C.name,
        {
            color: c.fg
        }
    ]} numberOfLines={1}>{L}</U><C1 style={C.metaRow}>{item.by === 'team' ? <m.Ionicons name="checkmark-circle" size={13} color={color}/> : null}{item.handle ? <U style={[
        C.meta,
        {
            color: c.muted,
            flexShrink: 1
        }
    ]} numberOfLines={1}>@{item.handle}</U> : null}{item.handle ? <U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>·</U> : null}<U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>{h.timeAgo(item.at)}</U><U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>·</U>{item.by === 'team' ? null : <m.Ionicons name={D.icon} size={12} color={y.KIND_COLOR[item.kind] ?? c.muted}/>}<U style={[
        C.meta,
        {
            color: item.by === 'team' ? c.muted : y.KIND_COLOR[item.kind] ?? c.muted,
            fontFamily: y.fonts.bodySemi
        }
    ]}>{item.by === 'team' ? 'Team' : D.label}</U></C1></C1>{badge ? <C1 style={[
        C.badge,
        {
            backgroundColor: /^#/.test(badge) ? y.BRAND.volt : y.alpha(color, c.dark ? 0.3 : 0.12)
        }
    ]}><m.Ionicons name={/^#/.test(badge) ? 'flame' : 'layers-outline'} size={11} color={/^#/.test(badge) ? y.BRAND.voltInk : y.inkFor(color, c, 0.5)}/><U style={[
        C.badgeText,
        {
            color: /^#/.test(badge) ? y.BRAND.voltInk : y.inkFor(color, c, 0.5)
        }
    ]}>{badge}</U></C1> : null}<L1 onPress={onSave} hitSlop={10} style={C.headBtn} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}><m.Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? y.inkFor(color, c) : c.muted}/></L1></L1>{item.kind === 'board' ? <L1 onPress={onPress} style={{
        paddingHorizontal: 14,
        gap: 6
    }}><U style={[
        C.title,
        {
            color: c.fg,
            paddingHorizontal: 0
        }
    ]}>{item.title}</U>{item.summary && item.summary !== item.title ? <U style={[
        C.body,
        {
            color: c.muted,
            paddingHorizontal: 0,
            fontSize: 14.5,
            lineHeight: 20
        }
    ]} numberOfLines={3}>{item.summary}</U> : null}<C1 style={C.metaRow}>{item.author ? <U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>Started by {item.author}</U> : null}{item.author && item.replies != null ? <U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>·</U> : null}{item.replies != null ? <><m.Ionicons name="chatbubbles-outline" size={12} color={c.muted}/><U style={[
        C.meta,
        {
            color: c.muted
        }
    ]}>{item.replies.toLocaleString()} {item.replies === 1 ? 'reply' : 'replies'}</U></> : null}</C1></L1> : item.kind === 'social' ? <L1 onPress={onPress}><U style={[
        C.body,
        {
            color: color_1
        }
    ]}>{item.title}</U></L1> : item.kind === 'news' ? <L1 onPress={onPress} style={C.newsRow}><C1 style={{
        flex: 1,
        minWidth: 0,
        gap: 5
    }}><U style={[
        C.headline,
        {
            color: color_1
        }
    ]} numberOfLines={4}>{item.title}</U>{item.summary && item.summary !== item.title ? <U style={[
        C.body,
        {
            color: c.muted,
            fontSize: 14,
            lineHeight: 19.5,
            paddingHorizontal: 0
        }
    ]} numberOfLines={2}>{item.summary}</U> : null}</C1>{item.image ? <C1 style={[
        C.thumb,
        $ && {
            opacity: 0.55
        }
    ]}><SComponent uri={item.image} ratio={1} fallback={y.alpha(color, 0.18)}/></C1> : null}</L1> : <L1 onPress={onPress}><U style={[
        C.title,
        {
            color: color_1
        }
    ]}>{item.title}</U></L1>}{item.kind === 'video' ? H && id ? <VComponent id={id}/> : <L1 onPress={()=>{
        x.markSeen(item.id);
        if (id) {
            setH(true);
        } else {
            onPress();
        }
    }} style={[
        C.media,
        $ && {
            opacity: 0.6
        }
    ]}><SComponent uri={item.image} ratio={1.7777777777777777} fallback="#0B0E14"><f.LinearGradient colors={[
        'transparent',
        'rgba(0,0,0,0.35)'
    ]} style={s.absoluteFill}/><C1 style={C.playCenter}><C1 style={C.playBig}><m.Ionicons name="play" size={26} color="#0D1017" style={{
        marginLeft: 3
    }}/></C1></C1>{item.duration ? <C1 style={C.dur}><U style={C.durText}>{item.duration}</U></C1> : null}</SComponent></L1> : item.kind === 'news' ? null : item.kind === 'pod' || item.kind === 'radio' ? <C1 style={{
        paddingHorizontal: 14
    }}><FComponent item={item} color={color} c={c}/></C1> : item.image && item.kind !== 'board' ? <L1 onPress={onPress} style={C.media}><SComponent uri={item.image} ratio={1} fallback={c.surface2}/></L1> : null}{item.players?.length ? <C1 style={{
        paddingHorizontal: 14
    }}><RComponent names={item.players} color={color} c={c} onPick={onPlayer}/></C1> : null}<EngageBar item={item}/><C1 style={{
        height: 2
    }}/></C1>;
};
const k = {
    news: {
        label: 'Article',
        icon: 'newspaper-outline'
    },
    video: {
        label: 'Video',
        icon: 'play-circle-outline'
    },
    pod: {
        label: 'Podcast',
        icon: 'mic-outline'
    },
    radio: {
        label: 'Radio',
        icon: 'radio-outline'
    },
    social: {
        label: 'Post',
        icon: 'chatbubble-outline'
    },
    board: {
        label: 'Thread',
        icon: 'chatbubbles-outline'
    }
};
const w = {
    Bluesky: 'cloud-outline',
    X: 'logo-twitter',
    Instagram: 'logo-instagram',
    TikTok: 'logo-tiktok',
    YouTube: 'logo-youtube'
};
function ZComponent({ item, color }) {
    const [n, setN] = t.useState(false);
    const f = item.show ?? item.source;
    const y = item.platform ? w[item.platform] : item.kind === 'video' ? 'logo-youtube' : /^r\//.test(item.source) ? 'logo-reddit' : null;
    if (y) {
        const backgroundColor = item.kind === 'video' ? '#E62117' : /^r\//.test(item.source) ? '#FF4500' : color;
        return <C1 style={[
            C.avatar,
            {
                backgroundColor
            }
        ]}><m.Ionicons name={y} size={18} color="#fff"/></C1>;
    }
    if ((item.kind === 'pod' || item.kind === 'radio') && item.image && !n) {
        return <O1 source={{
            uri: item.image
        }} style={[
            C.avatar,
            {
                borderRadius: 10
            }
        ]} onError={()=>setN(true)}/>;
    }
    const uri = item.kind !== 'news' || /news\.google\.com/.test(item.url) ? undefined : p.faviconFor(item.url);
    return <C1 style={[
        C.avatar,
        {
            backgroundColor: h.sourceColor(f)
        }
    ]}><U style={C.avatarText}>{h.initials(f) || '•'}</U>{uri && !n ? <O1 source={{
        uri
    }} style={C.favicon} onError={()=>setN(true)}/> : null}</C1>;
}
function SComponent({ uri, ratio, children, fallback }) {
    const [f, setF] = t.useState(false);
    return <C1 style={{
        aspectRatio: ratio,
        width: '100%',
        backgroundColor: fallback,
        overflow: 'hidden'
    }}>{uri && !f ? <O1 source={{
        uri
    }} style={s.absoluteFill} resizeMode="cover" onError={()=>setF(true)}/> : null}{children}</C1>;
}
function VComponent({ id }) {
    const src = `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    if (Platform.OS !== 'web') {
        return <WebView source={{
            uri: src
        }} style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: '#000'
        }} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} allowsFullscreenVideo/>;
    }
    return <iframe src={src} allow='autoplay; encrypted-media; picture-in-picture; fullscreen' allowFullScreen style={{
        width: '100%',
        aspectRatio: '16 / 9',
        border: 0,
        display: 'block',
        background: '#000'
    }}/>;
}
function I(e) {
    if (!e || !isFinite(e)) {
        return '0:00';
    }
    const t = Math.floor(e / 60);
    const o = Math.floor(e % 60);
    return `${t}:${String(o).padStart(2, '0')}`;
}
function FComponent({ item, color, c }) {
    const n = p.useEpisode(item.id);
    const s = n.duration ? Math.min(100, n.time / n.duration * 100) : 0;
    return <C1 style={[
        C.episode,
        {
            backgroundColor: c.surface2
        }
    ]}><L1 onPress={()=>{
        if (!p.toggleEpisode(item.id, item.audio, {
            title: item.title,
            show: item.show ?? item.source,
            image: item.image,
            url: item.url,
            color
        })) {
            p.openLink(item.url);
        }
    }} style={[
        C.playBtn,
        {
            backgroundColor: color
        }
    ]} accessibilityLabel={n.playing ? 'Pause episode' : 'Play episode'}><m.Ionicons name={n.playing ? 'pause' : 'play'} size={18} color="#fff" style={n.playing ? undefined : {
        marginLeft: 2
    }}/></L1><C1 style={{
        flex: 1,
        gap: 6
    }}><C1 style={[
        C.track,
        {
            backgroundColor: y.alpha(color, 0.18)
        }
    ]}><C1 style={{
        width: `${s}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 3
    }}/></C1><U style={[
        C.epTime,
        {
            color: c.muted
        }
    ]}>{n.id === item.id && n.duration ? `${I(n.time)} / ${I(n.duration)}` : item.audio ? `Play here${item.duration ? ` \xb7 ${item.duration}` : ''}` : `Listen on the show page${item.duration ? ` \xb7 ${item.duration}` : ''}`}</U></C1></C1>;
}
function RComponent({ names, color, c, onPick }) {
    if (onPick) {
        return <C1 style={C.tags}>{names.map((e)=><L1 key={e} onPress={()=>onPick(e)} style={[
                C.tag,
                {
                    backgroundColor: y.alpha(color, c.dark ? 0.22 : 0.1)
                }
            ]}><m.Ionicons name="person" size={11} color={y.inkFor(color, c, 0.5)}/><U style={[
                C.tagText,
                {
                    color: y.inkFor(color, c, 0.5)
                }
            ]}>{e}</U></L1>)}</C1>;
    }
    return <b.PlayerTags names={names} color={color} c={c}/>;
}
const C = s.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        gap: 10,
        paddingTop: 14
    },
    headline: {
        fontFamily: y.fonts.displayBold,
        fontSize: 18,
        lineHeight: 22.5,
        letterSpacing: -0.3
    },
    newsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 14,
        alignItems: 'flex-start'
    },
    thumb: {
        width: 92,
        borderRadius: 10,
        overflow: 'hidden'
    },
    media: {
        marginTop: 2
    },
    headBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center'
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    avatarText: {
        color: '#fff',
        fontFamily: y.fonts.displayBold,
        fontSize: 14
    },
    favicon: {
        position: 'absolute',
        width: 40,
        height: 40,
        backgroundColor: '#fff'
    },
    name: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 15
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2
    },
    meta: {
        fontFamily: y.fonts.body,
        fontSize: 12.5
    },
    body: {
        fontFamily: y.fonts.body,
        fontSize: 15.5,
        lineHeight: 22,
        paddingHorizontal: 14
    },
    title: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 16.5,
        lineHeight: 22,
        paddingHorizontal: 14
    },
    link: {
        overflow: 'hidden'
    },
    linkText: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4
    },
    domain: {
        fontFamily: y.fonts.mono,
        fontSize: 11,
        letterSpacing: 0.4
    },
    linkTitle: {
        fontFamily: y.fonts.bodyBold,
        fontSize: 16.5,
        lineHeight: 21.5
    },
    playCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    playBig: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    dur: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6
    },
    durText: {
        color: '#fff',
        fontFamily: y.fonts.monoBold,
        fontSize: 11.5
    },
    episode: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        padding: 10
    },
    playBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center'
    },
    track: {
        height: 5,
        borderRadius: 3,
        overflow: 'hidden'
    },
    epTime: {
        fontFamily: y.fonts.mono,
        fontSize: 11.5
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999
    },
    badgeText: {
        fontFamily: y.fonts.bodyBold,
        fontSize: 11
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999
    },
    tagText: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 12.5
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        paddingHorizontal: 14,
        paddingBottom: 12,
        paddingTop: 2
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
        maxWidth: 200
    },
    actionText: {
        fontFamily: y.fonts.bodySemi,
        fontSize: 13,
        flexShrink: 1
    }
});

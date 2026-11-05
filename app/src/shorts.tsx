// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { FlatList, Image as N, Platform, Pressable as O, Share as i, StyleSheet as l, Text as S1, View as D } from 'react-native';
import t from 'react';








import * as c from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as u from './data';
import { useCommunity } from './community';
import * as h from './theme';
import * as f from './links';
import * as g from './seen';

function VideoEngage({ item, style, textStyle }) {
    const cm = useCommunity();
    t.useEffect(()=>{
        cm?.watch(item.id);
    }, [
        item.id
    ]);
    if (!cm) {
        return null;
    }
    const st = cm.stats[item.id] ?? {
        reactions: {},
        mine: [],
        comments: 0,
        shares: 0
    };
    const liked = st.mine.includes('like');
    return <><O onPress={()=>cm.toggleReaction(item.id, 'like')} hitSlop={8} style={style} accessibilityLabel={liked ? 'Unlike' : 'Like'}><c.Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#E5484D' : '#fff'}/><S1 style={textStyle}>{st.reactions.like || 'Like'}</S1></O><O onPress={()=>cm.openComments(item)} hitSlop={8} style={style} accessibilityLabel="Comments"><c.Ionicons name="chatbubble-outline" size={19} color="#fff"/><S1 style={textStyle}>{st.comments || 'Comment'}</S1></O><O onPress={()=>cm.recordShare(item)} hitSlop={8} style={style} accessibilityLabel="Share"><c.Ionicons name="arrow-redo-outline" size={20} color="#fff"/><S1 style={textStyle}>{st.shares || 'Share'}</S1></O></>;
}
export const ShortsFeed = function({ items, topInset, bottomInset, isSaved, onSave, onClose, title, empty, header }) {
    const [v, setV] = t.useState({
        w: 0,
        h: 0
    });
    const [M, setM] = t.useState(0);
    t.useRef(null);
    const setIdx = t.useCallback((t)=>{
        setM(t);
        if (items[t]) {
            g.markSeen(items[t].id);
        }
    }, [
        items
    ]);
    const onNext = t.useCallback(()=>{
        if (!(M >= items.length - 1)) {
            setIdx(M + 1);
        }
    }, [
        M,
        items.length,
        setIdx
    ]);
    t.useRef({
        itemVisiblePercentThreshold: 80,
        minimumViewTime: 150
    }).current;
    t.useRef(({ viewableItems })=>{
        const t = viewableItems.find((e)=>e.isViewable);
        if (t?.index != null) {
            setM(t.index);
            g.markSeen(t.item.id);
        }
    }).current;
    t.useCallback((e, index)=>({
            length: v.h,
            offset: v.h * index,
            index
        }), [
        v.h
    ]);
    const T = Math.min(v.w, 720);
    return <D style={j.wrap}><D style={[
        j.bar,
        {
            paddingTop: topInset + 4
        }
    ]}><O onPress={onClose} hitSlop={10} style={j.barBtn} accessibilityLabel="Close videos"><c.Ionicons name="chevron-back" size={24} color="#fff"/></O><S1 style={j.barTitle} numberOfLines={1}>{title}</S1><S1 style={j.count}>{items.length ? `${M + 1}/${items.length}` : ''}</S1></D>{header}<D style={{
        flex: 1,
        marginBottom: bottomInset
    }} onLayout={(e)=>setV({
            w: Math.floor(e.nativeEvent.layout.width),
            h: Math.floor(e.nativeEvent.layout.height)
        })}>{v.h > 0 && (items.length ? <WComponent count={items.length} height={v.h} idx={M} setIdx={setIdx} render={(t)=><XComponent item={items[t]} active={t === M} height={v.h} width={T} saved={isSaved(items[t].id)} onSave={()=>onSave(items[t])} onNext={onNext} hasNext={t < items.length - 1}/>}/> : <S1 style={j.empty}>{empty}</S1>)}</D></D>;
};
const p = 118;
function BComponent(props) {
    if (Platform.OS !== 'web') {
        return <WebView source={{
            uri: `https://www.youtube.com/embed/${props.id}?autoplay=1&playsinline=1&rel=0`
        }} style={{
            width: props.w,
            height: props.h,
            backgroundColor: '#000'
        }} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} allowsFullscreenVideo/>;
    }
    return <BWebComponent {...props}/>;
}
function BWebComponent({ id, w, h: height, onEnded }) {
    const lRef = t.useRef(null);
    const s = typeof location !== 'undefined' ? location.origin : '';
    const src = `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&enablejsapi=1${s ? `&origin=${encodeURIComponent(s)}` : ''}`;
    t.useEffect(()=>{
        const e = (e)=>{
            try {
                if (!/(^|\.)youtube\.com$/.test(new URL(e.origin).hostname) || e.source !== lRef.current?.contentWindow) {
                    return;
                }
                const t = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (t.event === 'onStateChange' && t.info === 0 || t.event === 'infoDelivery' && t.info?.playerState === 0) {
                    onEnded();
                }
            } catch  {}
        };
        window.addEventListener('message', e);
        return ()=>window.removeEventListener('message', e);
    }, [
        onEnded
    ]);
    return <iframe ref={lRef} src={src} title='YouTube video player' allow='autoplay; encrypted-media; picture-in-picture; fullscreen' allowFullScreen onLoad={()=>{
        try {
            lRef.current?.contentWindow?.postMessage(JSON.stringify({
                event: 'listening',
                id
            }), 'https://www.youtube.com');
        } catch  {}
    }} style={{
        width: w,
        height,
        border: 0,
        display: 'block',
        background: '#000'
    }}/>;
}
function XComponent({ item, active, height, width, saved, onSave, onNext, hasNext }) {
    const id = f.youTubeId(item.url);
    const L = Math.max(p, Math.round(0.24 * height));
    const E = Math.max(40, Math.round(0.12 * width));
    const T = Math.max(200, width - 2 * E);
    const I = height - L - 14;
    const uri = item.image || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined);
    return <D style={[
        j.page,
        {
            height,
            width
        }
    ]}><D style={[
        j.stage,
        {
            height: I + 14,
            paddingTop: 14
        }
    ]}>{[
        0,
        1
    ].map((e)=><D key={e} pointerEvents="none" style={[
            j.railHint,
            e ? {
                right: 0
            } : {
                left: 0
            },
            {
                width: E,
                top: 14 + I / 2 - 30
            }
        ]}><D style={j.railLine}/></D>)}{active && id ? <BComponent id={id} w={Math.round(T)} h={Math.round(I)} onEnded={onNext}/> : <O onPress={()=>{
        if (!id) {
            g.markSeen(item.id);
            f.openLink(item.url);
        }
    }} accessibilityLabel={id ? item.title : `Open ${item.title}`}><D style={{
        width: T,
        height: I,
        backgroundColor: '#000'
    }}>{uri ? <N source={{
        uri
    }} style={l.absoluteFill} resizeMode="contain"/> : null}</D>{id ? null : <D style={j.openHint}><c.Ionicons name="open-outline" size={16} color="#fff"/><S1 style={j.openHintText}>Watch on {item.source}</S1></D>}</O>}</D><D style={[
        j.info,
        {
            height: L
        }
    ]}><D style={j.grab}><D style={j.grabBar}/></D><D style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12
    }}><D style={{
        flex: 1,
        minWidth: 0
    }}><S1 style={j.channel} numberOfLines={1}>{item.show ?? item.source} · {u.timeAgo(item.at)}</S1><S1 style={j.title} numberOfLines={2}>{item.title}</S1></D></D><D style={j.actions}><O onPress={onSave} hitSlop={8} style={j.action} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}><c.Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color="#fff"/><S1 style={j.actionText}>{saved ? 'Saved' : 'Save'}</S1></O><VideoEngage item={item} style={j.action} textStyle={j.actionText}/><D style={{
        flex: 1
    }}/><O onPress={()=>{
        g.markSeen(item.id);
        f.openLink(item.url);
    }} hitSlop={8} style={j.action} accessibilityLabel="Watch on YouTube"><c.Ionicons name={id ? 'logo-youtube' : 'open-outline'} size={20} color="#fff"/><S1 style={j.actionText}>{id ? 'YouTube' : `Watch on ${item.source}`}</S1></O></D></D></D>;
}
const v = 'cubic-bezier(0.16, 1, 0.3, 1)';
function WComponent(props) {
    if (Platform.OS !== 'web') {
        return <WNativeComponent {...props}/>;
    }
    return <WWebComponent {...props}/>;
}
function WNativeComponent({ count, height, idx, setIdx, render }) {
    const data = t.useMemo(()=>Array.from({
            length: count
        }, (_, i)=>i), [
        count
    ]);
    const ref = t.useRef(null);
    t.useEffect(()=>{
        ref.current?.scrollToOffset({
            offset: idx * height,
            animated: true
        });
    }, [
        idx,
        height
    ]);
    return <FlatList ref={ref} data={data} keyExtractor={(i)=>String(i)} pagingEnabled showsVerticalScrollIndicator={false} decelerationRate="fast" snapToInterval={height} getItemLayout={(_, i)=>({
            length: height,
            offset: height * i,
            index: i
        })} windowSize={3} initialNumToRender={2} onMomentumScrollEnd={(e)=>{
        const n = Math.round(e.nativeEvent.contentOffset.y / height);
        if (n !== idx) {
            setIdx(n);
        }
    }} renderItem={({ item: i })=><D style={{
            height
        }}>{Math.abs(i - idx) <= 1 ? render(i) : null}</D>}/>;
}
function WWebComponent({ count, height, idx, setIdx, render }) {
    const sRef = t.useRef(null);
    const dRef = t.useRef(null);
    const cRef = t.useRef({
        y0: 0,
        dy: 0,
        dragging: false,
        samples: [],
        wheelDy: 0,
        wheelTimer: 0,
        lockUntil: 0,
        lastV: 0
    });
    const u = (e, t = 0)=>{
        const dRef_current = dRef.current;
        if (dRef_current) {
            dRef_current.style.transition = t ? `transform ${t}ms ${v}` : 'none';
            dRef_current.style.transform = `translate3d(0, ${-idx * height + e}px, 0)`;
        }
    };
    const h = (e, t)=>Math.round(Math.max(240, Math.min(520, Math.abs(e) / Math.max(0.9, 1.6 * Math.abs(t)) * 1.1)));
    t.useEffect(()=>{
        const cRef_current = cRef.current;
        u(0, h(0.6 * height, cRef_current.lastV));
        cRef_current.lastV = 0;
    }, [
        idx,
        height
    ]);
    t.useEffect(()=>{
        const sRef_current = sRef.current;
        if (!sRef_current) {
            return;
        }
        const cRef_current = cRef.current;
        const f = (t)=>{
            if (idx === 0 && t > 0 || idx === count - 1 && t < 0) {
                return t / (1 + Math.abs(t) / (0.35 * height));
            }
            return t;
        };
        const g = (t, s)=>{
            const d = t + 160 * s;
            let c = 0;
            if (d < 0.33 * -height || s < -0.45 && t < -12) {
                c = 1;
            } else if (d > 0.33 * height || s > 0.45 && t > 12) {
                c = -1;
            }
            const f = Math.max(0, Math.min(count - 1, idx + c));
            if (f !== idx) {
                cRef_current.lastV = s;
                setIdx(f);
            } else {
                u(0, h(t, s));
            }
        };
        const y = ()=>{
            const cRef_current_samples = cRef_current.samples;
            if (cRef_current_samples.length < 2) {
                return 0;
            }
            const t = cRef_current_samples[cRef_current_samples.length - 1];
            const n = cRef_current_samples.find((e)=>t.t - e.t <= 90) ?? cRef_current_samples[0];
            return (t.y - n.y) / Math.max(1, t.t - n.t);
        };
        const p = (e)=>{
            cRef_current.dragging = true;
            cRef_current.y0 = e.touches[0].clientY;
            cRef_current.dy = 0;
            cRef_current.samples = [
                {
                    t: performance.now(),
                    y: cRef_current.y0
                }
            ];
            const t = dRef.current ? new DOMMatrixReadOnly(getComputedStyle(dRef.current).transform).m42 : -idx * height;
            cRef_current.y0 -= t + idx * height;
            u(t + idx * height, 0);
        };
        const b = (e)=>{
            if (!cRef_current.dragging) {
                return;
            }
            const clientY = e.touches[0].clientY;
            cRef_current.samples.push({
                t: performance.now(),
                y: clientY
            });
            if (cRef_current.samples.length > 12) {
                cRef_current.samples.shift();
            }
            cRef_current.dy = f(clientY - cRef_current.y0);
            u(cRef_current.dy, 0);
            e.preventDefault();
        };
        const x = ()=>{
            if (cRef_current.dragging) {
                cRef_current.dragging = false;
                g(cRef_current.dy, y());
            }
        };
        const v = (t)=>{
            t.preventDefault();
            const s = performance.now();
            if (s < cRef_current.lockUntil) {
                return;
            }
            if (t.deltaMode !== 0 || Math.abs(t.deltaY) >= 90) {
                const n = Math.max(0, Math.min(count - 1, idx + (t.deltaY > 0 ? 1 : -1)));
                return void (n !== idx && (cRef_current.lockUntil = s + 450, setIdx(n)));
            }
            cRef_current.wheelDy = f(cRef_current.wheelDy - t.deltaY);
            u(cRef_current.wheelDy, 0);
            clearTimeout(cRef_current.wheelTimer);
            cRef_current.wheelTimer = setTimeout(()=>{
                const cRef_current_wheelDy = cRef_current.wheelDy;
                cRef_current.wheelDy = 0;
                if (Math.abs(cRef_current_wheelDy) > 0.18 * height) {
                    const n = Math.max(0, Math.min(count - 1, idx + (cRef_current_wheelDy < 0 ? 1 : -1)));
                    if (n !== idx) {
                        cRef_current.lockUntil = performance.now() + 500;
                        return void setIdx(n);
                    }
                }
                u(0, h(cRef_current_wheelDy, 0));
            }, 90);
        };
        const w = (t)=>{
            const n = t.key === 'ArrowDown' || t.key === 'PageDown' ? 1 : t.key === 'ArrowUp' || t.key === 'PageUp' ? -1 : 0;
            if (!n) {
                return;
            }
            t.preventDefault();
            const l = Math.max(0, Math.min(count - 1, idx + n));
            if (l !== idx) {
                setIdx(l);
            }
        };
        sRef_current.addEventListener('touchstart', p, {
            passive: true
        });
        sRef_current.addEventListener('touchmove', b, {
            passive: false
        });
        sRef_current.addEventListener('touchend', x, {
            passive: true
        });
        sRef_current.addEventListener('touchcancel', x, {
            passive: true
        });
        sRef_current.addEventListener('wheel', v, {
            passive: false
        });
        window.addEventListener('keydown', w);
        return ()=>{
            sRef_current.removeEventListener('touchstart', p);
            sRef_current.removeEventListener('touchmove', b);
            sRef_current.removeEventListener('touchend', x);
            sRef_current.removeEventListener('touchcancel', x);
            sRef_current.removeEventListener('wheel', v);
            window.removeEventListener('keydown', w);
            clearTimeout(cRef_current.wheelTimer);
        };
    }, [
        idx,
        count,
        height,
        setIdx
    ]);
    const f = [];
    for(let i = 0; i < count; i++){
        f.push(<div key={i} style={{
            height,
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>{Math.abs(i - idx) <= 2 ? render(i) : null}</div>);
    }
    return <div ref={sRef} style={{
        height,
        overflow: 'hidden',
        touchAction: 'none',
        overscrollBehavior: 'none',
        userSelect: 'none'
    }}><div ref={dRef} style={{
        willChange: 'transform',
        transform: `translate3d(0, ${-idx * height}px, 0)`
    }}>{f}</div></div>;
}
const j = l.create({
    wrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 5
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 2
    },
    barBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center'
    },
    barTitle: {
        flex: 1,
        textAlign: 'center',
        color: '#fff',
        fontFamily: h.fonts.bodyBold,
        fontSize: 16
    },
    count: {
        width: 44,
        textAlign: 'right',
        paddingRight: 8,
        color: h.BRAND.volt,
        fontFamily: h.fonts.bodyBold,
        fontSize: 12.5
    },
    page: {
        alignSelf: 'center',
        backgroundColor: '#000'
    },
    stage: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    railHint: {
        position: 'absolute',
        alignItems: 'center'
    },
    railLine: {
        width: 3,
        height: 60,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.12)'
    },
    openHint: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16
    },
    openHintText: {
        color: '#fff',
        fontFamily: h.fonts.bodySemi,
        fontSize: 13
    },
    info: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 6,
        backgroundColor: '#0d0f13'
    },
    grab: {
        alignItems: 'center',
        gap: 4,
        marginBottom: 2
    },
    grabBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.35)'
    },
    grabText: {
        color: 'rgba(255,255,255,0.45)',
        fontFamily: h.fonts.bodySemi,
        fontSize: 11
    },
    channel: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: h.fonts.bodySemi,
        fontSize: 13
    },
    title: {
        color: '#fff',
        fontFamily: h.fonts.bodySemi,
        fontSize: 16,
        lineHeight: 21
    },
    next: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: h.BRAND.volt,
        alignItems: 'center',
        justifyContent: 'center'
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 22
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    actionText: {
        color: '#fff',
        fontFamily: h.fonts.bodySemi,
        fontSize: 13.5
    },
    empty: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: h.fonts.body,
        fontSize: 15,
        textAlign: 'center',
        marginTop: 60,
        paddingHorizontal: 24
    }
});

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Linking as n, Platform } from 'react-native';
import t from 'react';


import * as expo_web_browser from 'expo-web-browser';
import * as o from 'expo-audio';
export const openLink = async (e)=>{
    if (!e) {
        return;
    }
    window.open(e, '_blank', 'noopener') || (window.location.href = e);
};
export const youTubeId = function(e) {
    const t = String(e || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (t) {
        return t[1];
    }
    return null;
};
export const toggleEpisode = function(e, t, meta) {
    if (!t) {
        return false;
    }
    if (d) {
        if (s !== e) {
            d.replace(t);
            s = e;
            l = {
                id: e,
                playing: true,
                time: 0,
                duration: 0,
                meta
            };
            d.play();
        } else if (l.playing) {
            d.pause();
            l = {
                ...l,
                playing: false
            };
        } else {
            d.play();
            l = {
                ...l,
                playing: true
            };
        }
    } else {
        d = o.createAudioPlayer(t);
        d.addListener('playbackStatusUpdate', (e)=>{
            l = {
                ...l,
                playing: !!e.playing,
                time: e.currentTime || 0,
                duration: e.duration || 0
            };
            p();
        });
        s = e;
        l = {
            id: e,
            playing: true,
            time: 0,
            duration: 0,
            meta
        };
        d.play();
    }
    p();
    return true;
};
export const useEpisode = function(e) {
    const [n, setN] = t.useState(l);
    t.useEffect(()=>{
        f.add(setN);
        return ()=>{
            f.delete(setN);
        };
    }, []);
    if (n.id === e) {
        return n;
    }
    return {
        id: e,
        playing: false,
        time: 0,
        duration: 0,
        meta: undefined
    };
};
export const useNowPlaying = function() {
    const [e, setE] = t.useState(l);
    t.useEffect(()=>{
        f.add(setE);
        return ()=>{
            f.delete(setE);
        };
    }, []);
    return e;
};
export const seekBy = function(e) {
    if (!d) {
        return;
    }
    const t = Math.max(0, (l.time || 0) + e);
    d.seekTo(t).catch(()=>{});
};
export const stopEpisode = function() {
    if (d) {
        try {
            d.pause();
        } catch  {}
    }
    s = '';
    l = {
        id: '',
        playing: false,
        time: 0,
        duration: 0,
        meta: undefined
    };
    p();
};
let e;
(e = n) && e.__esModule;
((expo_web_browser_1)=>{
    if (expo_web_browser_1 && expo_web_browser_1.__esModule) {
        return expo_web_browser_1;
    }
    const t = {};
    if (expo_web_browser_1) {
        Object.keys(expo_web_browser_1).forEach((n)=>{
            const o = Object.getOwnPropertyDescriptor(expo_web_browser_1, n);
            Object.defineProperty(t, n, o.get ? o : {
                enumerable: true,
                get: function() {
                    return expo_web_browser_1[n];
                }
            });
        });
    }
    t.default = expo_web_browser_1;
})(expo_web_browser);
export function domainOf(e) {
    try {
        return new URL(String(e)).hostname.replace(/^www\./, '');
    } catch  {
        return '';
    }
}
export const faviconFor = (e)=>{
    const t = domainOf(e);
    if (t) {
        return `https://www.google.com/s2/favicons?domain=${t}&sz=64`;
    }
};
let d = null;
let s = '';
let l = {
    id: '',
    playing: false,
    time: 0,
    duration: 0,
    meta: undefined
};
const f = new Set;
const p = ()=>f.forEach((e)=>e({
            ...l
        }));

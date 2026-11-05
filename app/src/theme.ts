// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { useColorScheme as n } from 'react-native';
export const usePalette = function() {
    if (t.default() === 'dark') {
        return u;
    }
    return a;
};
export const alpha = function(e, n) {
    const t = parseInt(e.slice(1), 16);
    return `rgba(${t >> 16 & 255},${t >> 8 & 255},${255 & t},${n})`;
};
export const schoolColors = function(e, primary) {
    return F[p(e)] ?? {
        primary,
        band: shade(primary, 0.45),
        onDark: lift(primary, 0.45)
    };
};
export const inkFor = function(e, n, t = 0.45) {
    if (!n.dark) {
        return e;
    }
    const o = Object.values(F).find((n)=>n.primary.toLowerCase() === e.toLowerCase());
    if (o) {
        return o.onDark;
    }
    return lift(e, t);
};
let e;
var t = (e = n) && e.__esModule ? e : {
    default: e
};
export const fonts = {
    display: 'Archivo_900Black',
    displayBold: 'Archivo_800ExtraBold',
    body: 'Onest_400Regular',
    bodyMedium: 'Onest_500Medium',
    bodySemi: 'Onest_600SemiBold',
    bodyBold: 'Onest_700Bold',
    mono: 'JetBrainsMono_500Medium',
    monoBold: 'JetBrainsMono_700Bold'
};
const a = {
    bg: '#F3F4F7',
    surface: '#FFFFFF',
    surface2: '#E9EBF0',
    fg: '#0D1017',
    muted: '#5B6272',
    line: 'rgba(13,16,23,0.09)',
    live: '#E5484D',
    dark: false
};
const u = {
    bg: '#07090D',
    surface: '#11141B',
    surface2: '#1A1E27',
    fg: '#F2F4F8',
    muted: '#8E96A8',
    line: 'rgba(255,255,255,0.08)',
    live: '#E5484D',
    dark: true
};
export function lift(e, n) {
    const t = parseInt(e.slice(1), 16);
    const o = (e)=>Math.round(e + (255 - e) * n);
    return `rgb(${o(t >> 16 & 255)},${o(t >> 8 & 255)},${o(255 & t)})`;
}
export function shade(e, n) {
    const t = parseInt(e.slice(1), 16);
    const o = (e)=>Math.round(e * (1 - n));
    return `rgb(${o(t >> 16 & 255)},${o(t >> 8 & 255)},${o(255 & t)})`;
}
export const BRAND = {
    volt: '#D4FF3A',
    voltInk: '#0D1017'
};
export const STATUS = {
    live: '#E5484D',
    win: '#30A46C',
    loss: '#7A8191'
};
export const KIND_COLOR = {
    news: '#7A8191',
    video: '#14B8A6',
    pod: '#A855F7',
    radio: '#A855F7',
    social: '#38BDF8',
    board: '#F59E0B'
};
const F = {
    252: {
        primary: '#0062B8',
        band: '#002E5D',
        onDark: '#6FA8E6'
    },
    254: {
        primary: '#CC0000',
        band: '#7A0000',
        onDark: '#FF6B6B'
    },
    328: {
        primary: '#0F2439',
        band: '#0F2439',
        onDark: '#7FA3C9',
        head: '#1F4E82'
    }
};
const p = (e)=>e.match(/(\d+)$/)?.[1] ?? '';
export const officialColor = (e, n)=>F[p(e)]?.primary ?? n;
export const bandFor = (e)=>Object.values(F).find((n)=>n.primary.toLowerCase() === e.toLowerCase())?.band ?? shade(e, 0.45);
export const headFor = (e)=>Object.values(F).find((n)=>n.primary.toLowerCase() === e.toLowerCase())?.head ?? e;

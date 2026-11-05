// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import t from 'react';
import n from '@react-native-async-storage/async-storage';
export const markSeen = function(e) {
    if (u.has(e)) {
        return;
    }
    u.add(e);
    s.default.setItem(c, JSON.stringify([
        ...u
    ].slice(-800))).catch(()=>{});
    f.forEach((e)=>e());
};
export const useSeen = function(e) {
    const [, setN] = t.useState(0);
    t.useEffect(()=>{
        const e = ()=>setN((e)=>e + 1);
        f.add(e);
        return ()=>{
            f.delete(e);
        };
    }, []);
    return u.has(e);
};
let e;
var s = (e = n) && e.__esModule ? e : {
    default: e
};
const c = 'bl.seen.v1';
let u = new Set;
const f = new Set;
s.default.getItem(c).then((e)=>{
    if (e) {
        u = new Set(JSON.parse(e));
        f.forEach((e)=>e());
    }
}).catch(()=>{});

// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import t from 'react';
import a from '@react-native-async-storage/async-storage';
export const useAccount = function() {
    const [account, setAccount] = t.useState(null);
    const [loaded, setLoaded] = t.useState(false);
    t.useEffect(()=>{
        n.default.getItem(c).then((e)=>e && setAccount(JSON.parse(e))).catch(()=>{}).finally(()=>setLoaded(true));
    }, []);
    return {
        account,
        loaded,
        signIn: async (provider)=>{
            const t = {
                provider,
                name: provider === 'email' ? 'Diehard fan' : `${provider === 'apple' ? 'Apple' : 'Google'} account`,
                since: Date.now()
            };
            setAccount(t);
            await n.default.setItem(c, JSON.stringify(t)).catch(()=>{});
            return t;
        },
        signOut: async ()=>{
            setAccount(null);
            await n.default.multiRemove([
                c,
                'bl.followed.live',
                'bl.active'
            ]).catch(()=>{});
        }
    };
};
let e;
var n = (e = a) && e.__esModule ? e : {
    default: e
};
const c = 'dh.account.v1';

// Who's using the app. A real account comes from Supabase sign-in (Google, Apple or an email link).
// People can also browse as a guest; they're asked to sign in when they like, comment or post.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWith, signOut as authSignOut, supabase } from './supabase';

const GUEST_KEY = 'dh.account.v1';

export type Account = { provider: 'google' | 'apple' | 'email' | 'guest'; name: string; since: number; email?: string };

function fromSession(s: any): Account | null {
  const u = s?.user;
  if (!u) return null;
  const p = (u.app_metadata?.provider as string) || 'email';
  const meta = u.user_metadata ?? {};
  return {
    provider: p === 'google' || p === 'apple' ? p : 'email',
    name: meta.full_name || meta.name || u.email || 'Diehard fan',
    email: u.email,
    since: new Date(u.created_at).getTime(),
  };
}

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }) as any);
      const real = fromSession(data.session);
      if (real) { if (alive) setAccount(real); }
      else {
        const raw = await AsyncStorage.getItem(GUEST_KEY).catch(() => null);
        if (raw && alive) setAccount(JSON.parse(raw));
      }
      if (alive) setLoaded(true);
    })();
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      const real = fromSession(s);
      if (real) setAccount(real);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  return {
    account,
    loaded,
    /** 'guest' browses without an account. 'email' is handled by the caller (it needs an address). */
    signIn: async (provider: 'google' | 'apple' | 'guest') => {
      if (provider === 'guest') {
        const a: Account = { provider: 'guest', name: 'Guest', since: Date.now() };
        setAccount(a);
        await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(a)).catch(() => {});
        return a;
      }
      await signInWith(provider);
      return null;
    },
    signOut: async () => {
      await authSignOut();
      setAccount(null);
      await AsyncStorage.multiRemove([GUEST_KEY, 'bl.followed.live', 'bl.active']).catch(() => {});
    },
  };
}

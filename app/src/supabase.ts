// Supabase connection for sign-in and everything community (comments, reactions, chat).
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Project URL and the publishable (public) key. Both are safe to ship in the app;
// the database rules in supabase/schema.sql decide what each user can do.
export const SUPABASE_URL = 'https://ewoeduzxwzbhlbiwruxx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_3Bi8XLrfIQEE4eee967TiA_r43GOtkD';

const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: isWeb && typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
  },
});

// Where the sign-in page sends people back to.
// Web: the page they're on. Phone apps: the diehard:// link (scheme in app.json).
function redirectUrl() {
  if (isWeb && typeof window !== 'undefined') return window.location.origin + window.location.pathname;
  return 'diehard://auth';
}

export type Provider = 'google' | 'apple';

export async function signInWith(provider: Provider) {
  const redirectTo = redirectUrl();
  if (isWeb) {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
    return; // the browser leaves for the sign-in page and comes back signed in
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return;
  const code = new URL(res.url).searchParams.get('code');
  if (code) {
    const { error: e2 } = await supabase.auth.exchangeCodeForSession(code);
    if (e2) throw e2;
  }
}

// Email: sends a sign-in link. Opening it signs the person in.
export async function sendEmailLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectUrl() },
  });
  if (error) throw error;
}

// Email + password accounts.
export async function createAccount(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: redirectUrl() },
  });
  if (error) throw error;
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && !data.user.identities?.length) throw new Error('already registered');
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut().catch(() => {});
}

// Turn database errors into plain words.
export function friendlyError(e: any): string {
  const m = String(e?.message || e || '');
  if (/once every 30 days/i.test(m)) return 'You can switch home teams once every 30 days.';
  if (/Slow down/i.test(m)) return 'Slow down a little — new accounts can post once a minute.';
  if (/row-level security|violates/i.test(m))
    return "You can't post here. New accounts wait a few minutes, and you can only comment in your home team's spaces.";
  if (/JWT|not authenticated|session/i.test(m)) return 'Please sign in again.';
  if (/Invalid login credentials/i.test(m)) return "That email and password don't match. Try again or reset your password.";
  if (/already registered|already been registered|User already/i.test(m)) return 'That email already has an account. Tap "Sign in" instead.';
  if (/Password should be|weak.?password/i.test(m)) return 'Use a password with at least 8 characters.';
  if (/Email not confirmed/i.test(m)) return 'Check your email to confirm your account first.';
  if (/rate limit|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  if (/Failed to fetch|Network/i.test(m)) return "Couldn't reach Diehard. Check your connection.";
  return m || 'Something went wrong. Try again.';
}

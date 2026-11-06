// Diehard community: sign-in, fan profiles, likes/reactions/comments/shares on feed items,
// the Chat tab (team board and that team's game-day thread), reporting, blocking and the
// moderator review queue. Data lives in Supabase (see supabase/schema.sql).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fonts, BRAND, alpha, usePalette } from './theme';
import { timeAgo } from './data';
import { createAccount, friendlyError, sendPasswordReset, setNewPassword, signInWith, signInWithPassword, signOut as authSignOut, supabase } from './supabase';

// ---------- shared types & helpers ----------
type Palette = { bg: string; surface: string; surface2: string; fg: string; muted: string; line: string; live: string; dark: boolean };
type School = { id: string; short: string; name: string; color: string };
export type Profile = { id: string; display_name: string; home_team: string; is_moderator: boolean; created_at: string };
type Author = { display_name: string; home_team: string } | null;

export const REACTIONS = [
  { kind: 'fire', emoji: '🔥' },
  { kind: 'laugh', emoji: '😂' },
  { kind: 'mad', emoji: '😤' },
  { kind: 'dead', emoji: '💀' },
] as const;
const EMOJI: Record<string, string> = { like: '❤️', fire: '🔥', laugh: '😂', mad: '😤', dead: '💀' };

/** One key per school, shared by its football and basketball feeds: "school-252" for BYU. */
export const schoolKeyOf = (teamId?: string) => {
  const n = String(teamId || '').match(/(\d+)$/)?.[1];
  return n ? `school-${n}` : '';
};
const tap = () => Haptics.selectionAsync().catch(() => {});
const MAX_COMMENT = 1000;

type Stats = { reactions: Record<string, number>; mine: string[]; comments: number; shares: number };
const EMPTY: Stats = { reactions: {}, mine: [], comments: 0, shares: 0 };

type Ctx = {
  c: Palette;
  session: any;
  profile: Profile | null;
  ready: boolean;
  schools: School[];
  teamKey: string;
  blocked: Set<string>;
  flair: (homeTeam?: string) => { short: string; color: string } | null;
  stats: Record<string, Stats>;
  watch: (id: string) => void;
  toggleReaction: (id: string, kind: string) => void;
  recordShare: (item: any) => void;
  openComments: (item: any) => void;
  openReport: (target: ReportTarget) => void;
  /** Returns the profile, or opens sign-in / join and returns null. */
  needProfile: () => Profile | null;
  openSignIn: () => void;
  openEmail: () => void;
  setScope: (team: { id: string } | undefined, schools: School[]) => void;
  block: (userId: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};
const CommunityContext = createContext<Ctx | null>(null);
export const useCommunity = () => useContext(CommunityContext);

type ReportTarget = { type: 'comment' | 'post' | 'thread' | 'user'; id: string; userId?: string; name?: string };

// ---------- provider ----------
export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const c = usePalette() as Palette;
  const [schools, setSchools] = useState<School[]>([]);
  const [team, setTeam] = useState<{ id: string } | undefined>(undefined);
  const setScope = useCallback((t: { id: string } | undefined, list: School[]) => {
    setTeam((old) => (old?.id === t?.id ? old : t));
    setSchools((old) => (old.length === list.length && old.every((x, i) => x.id === list[i].id) ? old : list));
  }, []);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [commentsFor, setCommentsFor] = useState<any>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [sheet, setSheet] = useState<'' | 'signin' | 'email' | 'join' | 'newpass'>('');
  const queue = useRef<Set<string>>(new Set());
  const loaded = useRef<Set<string>>(new Set());
  const timer = useRef<any>(null);
  const teamKey = schoolKeyOf(team?.id);
  const uid = session?.user?.id as string | undefined;

  const reloadProfile = useCallback(async () => {
    if (!uid) { setProfile(null); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile) ?? null);
    const b = await supabase.from('blocks').select('blocked_id').eq('blocker_id', uid);
    setBlocked(new Set((b.data ?? []).map((r: any) => r.blocked_id)));
  }, [uid]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((e, s) => { setSession(s); if (e === 'PASSWORD_RECOVERY') setSheet('newpass'); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { reloadProfile(); }, [reloadProfile]);

  // Counts for the cards on screen, fetched in small batches.
  const flush = useCallback(async () => {
    timer.current = null;
    const ids = [...queue.current];
    queue.current.clear();
    if (!ids.length) return;
    const [r, cm, sh] = await Promise.all([
      supabase.from('item_reactions').select('item_id,kind,user_id').in('item_id', ids),
      supabase.from('comments').select('item_id,user_id').in('item_id', ids),
      supabase.from('item_shares').select('item_id').in('item_id', ids),
    ]);
    const next: Record<string, Stats> = {};
    for (const id of ids) next[id] = { reactions: {}, mine: [], comments: 0, shares: 0 };
    for (const row of (r.data ?? []) as any[]) {
      const s = next[row.item_id];
      s.reactions[row.kind] = (s.reactions[row.kind] || 0) + 1;
      if (row.user_id === uid) s.mine.push(row.kind);
    }
    for (const row of (cm.data ?? []) as any[]) if (!blocked.has(row.user_id)) next[row.item_id].comments++;
    for (const row of (sh.data ?? []) as any[]) next[row.item_id].shares++;
    setStats((old) => ({ ...old, ...next }));
  }, [uid, blocked]);

  const watch = useCallback((id: string) => {
    if (!id || loaded.current.has(id)) return;
    loaded.current.add(id);
    queue.current.add(id);
    if (!timer.current) timer.current = setTimeout(flush, 80);
  }, [flush]);

  // Re-fetch counts when the signed-in user changes (so "mine" is right).
  useEffect(() => {
    const ids = [...loaded.current];
    if (!ids.length) return;
    ids.forEach((id) => queue.current.add(id));
    if (!timer.current) timer.current = setTimeout(flush, 80);
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const needProfile = useCallback(() => {
    if (!session) { setSheet('signin'); return null; }
    if (!profile) { setSheet('join'); return null; }
    return profile;
  }, [session, profile]);

  const toggleReaction = useCallback((id: string, kind: string) => {
    const p = needProfile();
    if (!p) return;
    tap();
    const cur = stats[id] ?? EMPTY;
    const has = cur.mine.includes(kind);
    setStats((old) => {
      const s = old[id] ?? EMPTY;
      const reactions = { ...s.reactions, [kind]: Math.max(0, (s.reactions[kind] || 0) + (has ? -1 : 1)) };
      const mine = has ? s.mine.filter((k) => k !== kind) : [...s.mine, kind];
      return { ...old, [id]: { ...s, reactions, mine } };
    });
    const q = has
      ? supabase.from('item_reactions').delete().match({ item_id: id, user_id: p.id, kind })
      : supabase.from('item_reactions').insert({ item_id: id, user_id: p.id, kind });
    q.then(({ error }) => {
      if (error) { // undo
        setStats((old) => {
          const s = old[id] ?? EMPTY;
          const reactions = { ...s.reactions, [kind]: Math.max(0, (s.reactions[kind] || 0) + (has ? 1 : -1)) };
          const mine = has ? [...s.mine, kind] : s.mine.filter((k) => k !== kind);
          return { ...old, [id]: { ...s, reactions, mine } };
        });
      }
    });
  }, [needProfile, stats]);

  const recordShare = useCallback(async (item: any) => {
    tap();
    const url = item.url;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !(navigator as any).share) {
        await (navigator as any).clipboard?.writeText(url);
      } else {
        await Share.share({ message: `${item.title}\n${url}` });
      }
    } catch { return; }
    setStats((old) => { const s = old[item.id] ?? EMPTY; return { ...old, [item.id]: { ...s, shares: s.shares + 1 } }; });
    supabase.from('item_shares').insert({ item_id: item.id, user_id: uid ?? null }).then(() => {});
  }, [uid]);

  const block = useCallback(async (userId: string, _name: string) => {
    const p = needProfile();
    if (!p || userId === p.id) return;
    setBlocked((b) => new Set([...b, userId]));
    await supabase.from('blocks').insert({ blocker_id: p.id, blocked_id: userId });
  }, [needProfile]);

  const flair = useCallback((homeTeam?: string) => {
    if (!homeTeam) return null;
    const s = schools.find((t) => schoolKeyOf(t.id) === homeTeam);
    return s ? { short: s.short, color: s.color } : null;
  }, [schools]);

  const signOut = useCallback(async () => { await authSignOut(); setProfile(null); }, []);

  const value: Ctx = {
    c, session, profile, ready, schools, teamKey, blocked, flair, stats, watch, toggleReaction, recordShare,
    openComments: (item) => { tap(); setCommentsFor(item); },
    openReport: (t) => { if (needProfile()) setReport(t); },
    needProfile, openSignIn: () => setSheet('signin'), openEmail: () => setSheet('email'), setScope,
    block, signOut, reloadProfile,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
      <CommentsSheet item={commentsFor} onClose={() => setCommentsFor(null)} />
      <ReportSheet target={report} onClose={() => setReport(null)} />
      <SignInSheet open={sheet === 'signin'} onClose={() => setSheet('')} onEmail={() => setSheet('email')} />
      <EmailSheet open={sheet === 'email'} onClose={() => setSheet('')} onCreated={() => setSheet('join')} />
      <NewPasswordSheet open={sheet === 'newpass'} onClose={() => setSheet('')} />
      <JoinSheet open={sheet === 'join' || (!!session && !profile && sheet === 'signin')} onClose={() => setSheet('')} />
    </CommunityContext.Provider>
  );
}

// ---------- small building blocks ----------
function Sheet({ open, onClose, children, tall }: { open: boolean; onClose: () => void; children: React.ReactNode; tall?: boolean }) {
  const ctx = useCommunity()!;
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={st.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[st.sheet, { backgroundColor: ctx.c.bg, paddingBottom: insets.bottom + 12 }, tall && { height: '86%' }]}>
          <View style={[st.grab, { backgroundColor: ctx.c.line }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Flair({ homeTeam, size = 10 }: { homeTeam?: string; size?: number }) {
  const ctx = useCommunity()!;
  const f = ctx.flair(homeTeam);
  if (!f) return null;
  return (
    <View style={[st.flair, { backgroundColor: f.color }]}>
      <Text style={[st.flairText, { fontSize: size }]}>{f.short}</Text>
    </View>
  );
}

function Avatar({ name, homeTeam, size = 30 }: { name?: string; homeTeam?: string; size?: number }) {
  const ctx = useCommunity()!;
  const f = ctx.flair(homeTeam);
  const letters = String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[st.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: f?.color ?? ctx.c.surface2 }]}>
      <Text style={[st.avatarText, { fontSize: size * 0.38 }]}>{letters}</Text>
    </View>
  );
}

function Btn({ label, onPress, kind = 'primary', icon, disabled, busy }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'dark'; icon?: any; disabled?: boolean; busy?: boolean }) {
  const ctx = useCommunity()!;
  const bg = kind === 'primary' ? BRAND.volt : kind === 'dark' ? ctx.c.fg : 'transparent';
  const fg = kind === 'primary' ? BRAND.voltInk : kind === 'dark' ? ctx.c.bg : ctx.c.fg;
  return (
    <Pressable onPress={onPress} disabled={disabled || busy}
      style={({ pressed }) => [st.btn, { backgroundColor: bg, borderColor: kind === 'ghost' ? ctx.c.line : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}>
      {busy ? <ActivityIndicator color={fg} /> : <>{icon ? <Ionicons name={icon} size={17} color={fg} /> : null}<Text style={[st.btnText, { color: fg }]}>{label}</Text></>}
    </Pressable>
  );
}

// ---------- engage bar on every feed card ----------
export function EngageBar({ item, dark }: { item: any; dark?: boolean }) {
  const ctx = useCommunity();
  const [picker, setPicker] = useState(false);
  useEffect(() => { ctx?.watch(item.id); }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ctx) return null;
  const s = ctx.stats[item.id] ?? EMPTY;
  const fg = dark ? '#fff' : ctx.c.muted;
  const liked = s.mine.includes('like');
  const others = REACTIONS.filter((r) => s.reactions[r.kind]);
  return (
    <View>
      <View style={[st.bar, !dark && { borderTopColor: ctx.c.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
        <Pressable onPress={() => ctx.toggleReaction(item.id, 'like')} hitSlop={6} style={st.barBtn} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={19} color={liked ? '#E5484D' : fg} />
          {s.reactions.like ? <Text style={[st.barCount, { color: fg }]}>{s.reactions.like}</Text> : null}
        </Pressable>
        <Pressable onPress={() => { tap(); setPicker((p) => !p); }} hitSlop={6} style={st.barBtn} accessibilityLabel="React">
          {others.length ? (
            <Text style={[st.barCount, { color: fg }]}>
              {others.map((r) => r.emoji).join('')} {others.reduce((n, r) => n + (s.reactions[r.kind] || 0), 0)}
            </Text>
          ) : <Ionicons name="happy-outline" size={19} color={fg} />}
        </Pressable>
        <Pressable onPress={() => ctx.openComments(item)} hitSlop={6} style={st.barBtn} accessibilityLabel="Comments">
          <Ionicons name="chatbubble-outline" size={18} color={fg} />
          {s.comments ? <Text style={[st.barCount, { color: fg }]}>{s.comments}</Text> : null}
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => ctx.recordShare(item)} hitSlop={6} style={st.barBtn} accessibilityLabel="Share">
          <Ionicons name="arrow-redo-outline" size={19} color={fg} />
          {s.shares ? <Text style={[st.barCount, { color: fg }]}>{s.shares}</Text> : null}
        </Pressable>
      </View>
      {picker ? (
        <View style={[st.picker, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : ctx.c.surface2 }]}>
          {REACTIONS.map((r) => {
            const on = s.mine.includes(r.kind);
            return (
              <Pressable key={r.kind} onPress={() => ctx.toggleReaction(item.id, r.kind)}
                style={[st.pick, on && { backgroundColor: alpha(BRAND.volt, 0.35) }]} accessibilityLabel={`React ${r.kind}`}>
                <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                {s.reactions[r.kind] ? <Text style={[st.pickCount, { color: dark ? '#fff' : ctx.c.fg }]}>{s.reactions[r.kind]}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ---------- comments ----------
type Comment = { id: string; item_id: string; user_id: string; parent_id: string | null; body: string; created_at: string; hidden: boolean; author: Author };

function CommentsSheet({ item, onClose }: { item: any; onClose: () => void }) {
  const ctx = useCommunity()!;
  const [rows, setRows] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const id = item?.id;
  const itemTeam = item?.teamKey || ctx.teamKey;

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('comments')
      .select('id,item_id,user_id,parent_id,body,created_at,hidden,author:profiles(display_name,home_team)')
      .eq('item_id', id).order('created_at', { ascending: true }).limit(500);
    setRows((data as any) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setRows([]); setLoading(true); setText(''); setReplyTo(null); setErr('');
    load();
    const ch = supabase.channel(`comments-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `item_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  const visible = rows.filter((r) => !ctx.blocked.has(r.user_id));
  const top = visible.filter((r) => !r.parent_id);
  const repliesOf = (pid: string) => visible.filter((r) => r.parent_id === pid);
  const canComment = !!ctx.profile && ctx.profile.home_team === itemTeam;
  const teamName = ctx.schools.find((s) => schoolKeyOf(s.id) === itemTeam)?.short ?? 'this team';

  const send = async () => {
    const p = ctx.needProfile();
    if (!p || !text.trim()) return;
    setBusy(true); setErr('');
    const { error } = await supabase.from('comments').insert({
      item_id: id, team_id: itemTeam, user_id: p.id, parent_id: replyTo?.id ?? null, body: text.trim().slice(0, MAX_COMMENT),
    });
    setBusy(false);
    if (error) { setErr(friendlyError(error)); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setText(''); setReplyTo(null);
    load();
  };

  const remove = async (cm: Comment) => {
    await supabase.from('comments').delete().eq('id', cm.id);
    load();
  };

  const renderOne = (cm: Comment, reply = false) => (
    <MessageRow key={cm.id} reply={reply} userId={cm.user_id} author={cm.author} at={cm.created_at} body={cm.body} hidden={cm.hidden}
      onReply={reply || !canComment ? undefined : () => setReplyTo(cm)}
      onReport={() => ctx.openReport({ type: 'comment', id: cm.id, userId: cm.user_id, name: cm.author?.display_name })}
      onDelete={cm.user_id === ctx.profile?.id || ctx.profile?.is_moderator ? () => remove(cm) : undefined} />
  );

  return (
    <Sheet open={!!item} onClose={onClose} tall>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>Comments{visible.length ? ` · ${visible.length}` : ''}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      {item ? <Text style={[st.sheetSub, { color: ctx.c.muted }]} numberOfLines={2}>{item.title}</Text> : null}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={ctx.c.muted} /> : null}
        {!loading && !top.length ? <Text style={[st.empty, { color: ctx.c.muted }]}>No comments yet. Start the conversation.</Text> : null}
        {top.map((cm) => (
          <View key={cm.id}>
            {renderOne(cm)}
            {repliesOf(cm.id).map((r) => renderOne(r, true))}
          </View>
        ))}
      </ScrollView>
      <Composer
        placeholder={replyTo ? `Reply to ${replyTo.author?.display_name ?? 'fan'}…` : 'Add a comment…'}
        value={text} onChange={setText} onSend={send} busy={busy} error={err}
        banner={replyTo ? { text: `Replying to ${replyTo.author?.display_name ?? 'fan'}`, onCancel: () => setReplyTo(null) } : null}
        locked={!ctx.session ? 'signin' : !ctx.profile ? 'join' : !canComment ? `Only ${teamName} fans can comment here. You can still react and share.` : ''} />
    </Sheet>
  );
}

function MessageRow({ userId, author, at, body, hidden, reply, onReply, onReport, onDelete, onLike, likes, liked }: {
  userId: string; author: Author; at: string; body: string; hidden?: boolean; reply?: boolean;
  onReply?: () => void; onReport: () => void; onDelete?: () => void; onLike?: () => void; likes?: number; liked?: boolean;
}) {
  const ctx = useCommunity()!;
  const [menu, setMenu] = useState(false);
  const mine = userId === ctx.profile?.id;
  return (
    <View style={[st.msg, reply && { paddingLeft: 52 }]}>
      <Avatar name={author?.display_name} homeTeam={author?.home_team} size={reply ? 26 : 32} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={st.msgHead}>
          <Text style={[st.msgName, { color: ctx.c.fg }]} numberOfLines={1}>{author?.display_name ?? 'Fan'}</Text>
          <Flair homeTeam={author?.home_team} />
          <Text style={[st.msgTime, { color: ctx.c.muted }]}>{timeAgo(new Date(at).getTime())}</Text>
        </View>
        {hidden ? <Text style={[st.msgHidden, { color: ctx.c.muted }]}>Hidden after reports. Only you{mine ? '' : ' (moderator)'} can see this.</Text> : null}
        <Text style={[st.msgBody, { color: hidden ? ctx.c.muted : ctx.c.fg }]}>{body}</Text>
        <View style={st.msgActions}>
          {onLike ? (
            <Pressable onPress={onLike} hitSlop={8} style={st.msgAction}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#E5484D' : ctx.c.muted} />
              {likes ? <Text style={[st.msgActionText, { color: ctx.c.muted }]}>{likes}</Text> : null}
            </Pressable>
          ) : null}
          {onReply ? <Pressable onPress={onReply} hitSlop={8}><Text style={[st.msgActionText, { color: ctx.c.muted }]}>Reply</Text></Pressable> : null}
          <Pressable onPress={() => setMenu((m) => !m)} hitSlop={8} accessibilityLabel="More"><Ionicons name="ellipsis-horizontal" size={16} color={ctx.c.muted} /></Pressable>
        </View>
        {menu ? (
          <View style={[st.menu, { backgroundColor: ctx.c.surface, borderColor: ctx.c.line }]}>
            {!mine ? <MenuItem icon="flag-outline" label="Report" onPress={() => { setMenu(false); onReport(); }} /> : null}
            {!mine ? <MenuItem icon="remove-circle-outline" label={`Block ${author?.display_name ?? 'this fan'}`} onPress={() => { setMenu(false); ctx.block(userId, author?.display_name ?? ''); }} /> : null}
            {onDelete ? <MenuItem icon="trash-outline" label="Delete" danger onPress={() => { setMenu(false); onDelete(); }} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function MenuItem({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
  const ctx = useCommunity()!;
  const color = danger ? ctx.c.live : ctx.c.fg;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.menuItem, pressed && { backgroundColor: ctx.c.surface2 }]}>
      <Ionicons name={icon} size={16} color={color} /><Text style={[st.menuText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function Composer({ placeholder, value, onChange, onSend, busy, error, banner, locked, max = MAX_COMMENT }: {
  placeholder: string; value: string; onChange: (t: string) => void; onSend: () => void; busy?: boolean; error?: string;
  banner?: { text: string; onCancel: () => void } | null; locked?: string; max?: number;
}) {
  const ctx = useCommunity()!;
  if (locked === 'signin' || locked === 'join') {
    return (
      <View style={[st.composer, { borderTopColor: ctx.c.line }]}>
        <Btn label={locked === 'signin' ? 'Sign in to join the conversation' : 'Pick your name and home team'} onPress={() => ctx.needProfile()} />
      </View>
    );
  }
  if (locked) {
    return <View style={[st.composer, { borderTopColor: ctx.c.line }]}><Text style={[st.lockText, { color: ctx.c.muted }]}>{locked}</Text></View>;
  }
  return (
    <View style={[st.composer, { borderTopColor: ctx.c.line }]}>
      {banner ? (
        <View style={st.bannerRow}>
          <Text style={[st.bannerText, { color: ctx.c.muted }]}>{banner.text}</Text>
          <Pressable onPress={banner.onCancel} hitSlop={8}><Ionicons name="close-circle" size={16} color={ctx.c.muted} /></Pressable>
        </View>
      ) : null}
      {error ? <Text style={[st.error, { color: ctx.c.live }]}>{error}</Text> : null}
      <View style={st.inputRow}>
        <TextInput value={value} onChangeText={(t) => onChange(t.slice(0, max))} placeholder={placeholder} placeholderTextColor={ctx.c.muted}
          multiline style={[st.input, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line }]}
          onSubmitEditing={onSend} blurOnSubmit={false} />
        <Pressable onPress={onSend} disabled={!value.trim() || busy} accessibilityLabel="Send"
          style={[st.send, { backgroundColor: value.trim() ? BRAND.volt : ctx.c.surface2 }]}>
          {busy ? <ActivityIndicator color={BRAND.voltInk} /> : <Ionicons name="arrow-up" size={20} color={value.trim() ? BRAND.voltInk : ctx.c.muted} />}
        </Pressable>
      </View>
    </View>
  );
}

// ---------- reporting ----------
const REASONS = [
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'hate', label: 'Hate or slurs' },
  { key: 'spam', label: 'Spam or scam' },
  { key: 'off_topic', label: 'Trolling or off topic' },
  { key: 'other', label: 'Something else' },
];

function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const ctx = useCommunity()!;
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setDone(false); setErr(''); }, [target]);
  const send = async (reason: string) => {
    if (!target || !ctx.profile) return;
    const { error } = await supabase.from('reports').insert({ target_type: target.type, target_id: target.id, reporter_id: ctx.profile.id, reason });
    if (error && !/duplicate/i.test(error.message)) { setErr(friendlyError(error)); return; }
    setDone(true);
  };
  return (
    <Sheet open={!!target} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>{done ? 'Thanks for reporting' : 'Report'}</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      {done ? (
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <Text style={[st.body, { color: ctx.c.muted }]}>We'll review it. Posts with several reports are hidden automatically until a moderator checks them.</Text>
          {target?.userId && target.userId !== ctx.profile?.id ? (
            <Btn kind="ghost" icon="remove-circle-outline" label={`Also block ${target.name ?? 'this fan'}`} onPress={() => { ctx.block(target.userId!, target.name ?? ''); onClose(); }} />
          ) : null}
          <Btn label="Done" onPress={onClose} />
        </View>
      ) : (
        <View style={{ paddingBottom: 8 }}>
          <Text style={[st.body, { color: ctx.c.muted, marginBottom: 8 }]}>What's wrong with it?</Text>
          {REASONS.map((r) => (
            <Pressable key={r.key} onPress={() => send(r.key)} style={({ pressed }) => [st.reason, { borderColor: ctx.c.line }, pressed && { backgroundColor: ctx.c.surface2 }]}>
              <Text style={[st.reasonText, { color: ctx.c.fg }]}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={ctx.c.muted} />
            </Pressable>
          ))}
          {err ? <Text style={[st.error, { color: ctx.c.live }]}>{err}</Text> : null}
        </View>
      )}
    </Sheet>
  );
}

// ---------- sign in & join ----------
function SignInSheet({ open, onClose, onEmail }: { open: boolean; onClose: () => void; onEmail: () => void }) {
  const ctx = useCommunity()!;
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const go = async (p: 'google' | 'apple') => {
    setBusy(p); setErr('');
    try { await signInWith(p); } catch (e) { setErr(friendlyError(e)); }
    setBusy('');
  };
  if (ctx.session) return null;
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>Join the conversation</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      <Text style={[st.body, { color: ctx.c.muted, marginBottom: 14 }]}>Sign in to like, comment and post in the chat. Reading stays free, no account needed.</Text>
      <View style={{ gap: 10 }}>
        <Btn kind="dark" icon="logo-google" label="Continue with Google" busy={busy === 'google'} onPress={() => go('google')} />
        <Btn kind="dark" icon="logo-apple" label="Continue with Apple" busy={busy === 'apple'} onPress={() => go('apple')} />
        <Btn kind="ghost" icon="mail-outline" label="Email and password" onPress={onEmail} />
      </View>
      {err ? <Text style={[st.error, { color: ctx.c.live, marginTop: 10 }]}>{err}</Text> : null}
    </Sheet>
  );
}

export function EmailSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const ctx = useCommunity()!;
  const [mode, setMode] = useState<'create' | 'signin' | 'forgot'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (open) { setErr(''); setNote(''); setPassword(''); } }, [open]);
  useEffect(() => { setErr(''); setNote(''); }, [mode]);

  const submit = async () => {
    const e = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) { setErr('Enter a valid email address.'); return; }
    if (mode !== 'forgot' && password.length < 8) { setErr('Use a password with at least 8 characters.'); return; }
    setBusy(true); setErr(''); setNote('');
    try {
      if (mode === 'create') {
        const d = await createAccount(e, password);
        if (d.session) { onCreated ? onCreated() : onClose(); }
        else setNote('Almost there — check your email to confirm your account, then sign in.');
      } else if (mode === 'signin') {
        await signInWithPassword(e, password);
        onClose();
      } else {
        await sendPasswordReset(e);
        setNote(`If ${e} has an account, we sent a link to reset your password.`);
      }
    } catch (x) { setErr(friendlyError(x)); }
    setBusy(false);
  };

  const title = mode === 'create' ? 'Create your account' : mode === 'signin' ? 'Welcome back' : 'Reset your password';
  const fieldStyle = [st.field, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line }];
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      {mode !== 'forgot' ? (
        <View style={[st.tabs, { backgroundColor: ctx.c.surface2 }]}>
          {(['create', 'signin'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[st.tab, mode === m && { backgroundColor: ctx.c.bg }]}>
              <Text style={[st.tabText, { color: mode === m ? ctx.c.fg : ctx.c.muted }]}>{m === 'create' ? 'Create account' : 'Sign in'}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[st.body, { color: ctx.c.muted, marginBottom: 10 }]}>Enter your email and we'll send you a link to set a new password.</Text>
      )}
      <View style={{ gap: 10 }}>
        <Text style={[st.label, { color: ctx.c.muted }]}>EMAIL</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={ctx.c.muted}
          autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" style={fieldStyle} />
        {mode !== 'forgot' ? (
          <>
            <Text style={[st.label, { color: ctx.c.muted, marginTop: 4 }]}>PASSWORD</Text>
            <View>
              <TextInput value={password} onChangeText={setPassword} placeholder={mode === 'create' ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={ctx.c.muted} secureTextEntry={!show} autoCapitalize="none"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                textContentType={mode === 'create' ? 'newPassword' : 'password'} onSubmitEditing={submit}
                style={[...fieldStyle, { paddingRight: 48 }]} />
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={st.eye} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={ctx.c.muted} />
              </Pressable>
            </View>
          </>
        ) : null}
        {err ? <Text style={[st.error, { color: ctx.c.live }]}>{err}</Text> : null}
        {note ? <Text style={[st.body, { color: ctx.c.fg }]}>{note}</Text> : null}
        <View style={{ marginTop: 4 }}>
          <Btn label={mode === 'create' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Send reset link'} busy={busy} onPress={submit} />
        </View>
        {mode === 'signin' ? (
          <Pressable onPress={() => setMode('forgot')} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 6 }}>
            <Text style={[st.link, { color: ctx.c.muted }]}>Forgot password?</Text>
          </Pressable>
        ) : mode === 'forgot' ? (
          <Pressable onPress={() => setMode('signin')} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 6 }}>
            <Text style={[st.link, { color: ctx.c.muted }]}>Back to sign in</Text>
          </Pressable>
        ) : (
          <Text style={[st.small, { color: ctx.c.muted, textAlign: 'center' }]}>Next you'll pick the name other fans see and your home team.</Text>
        )}
      </View>
    </Sheet>
  );
}

function NewPasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ctx = useCommunity()!;
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setPassword(''); setErr(''); setDone(false); } }, [open]);
  const save = async () => {
    if (password.length < 8) { setErr('Use a password with at least 8 characters.'); return; }
    setBusy(true); setErr('');
    try { await setNewPassword(password); setDone(true); } catch (x) { setErr(friendlyError(x)); }
    setBusy(false);
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>{done ? 'Password updated' : 'Set a new password'}</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      {done ? <Btn label="Done" onPress={onClose} /> : (
        <View style={{ gap: 12 }}>
          <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={ctx.c.muted}
            secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" onSubmitEditing={save}
            style={[st.field, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line }]} />
          {err ? <Text style={[st.error, { color: ctx.c.live }]}>{err}</Text> : null}
          <Btn label="Save password" busy={busy} onPress={save} />
        </View>
      )}
    </Sheet>
  );
}

function JoinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ctx = useCommunity()!;
  const meta = ctx.session?.user?.user_metadata ?? {};
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const schools = useMemo(() => {
    const seen = new Set<string>();
    return ctx.schools.filter((s) => { const k = schoolKeyOf(s.id); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }, [ctx.schools]);
  useEffect(() => {
    if (!open) return;
    setName(String(meta.full_name || meta.name || '').split(' ').slice(0, 2).join(' ').slice(0, 24));
    setTeam(ctx.teamKey || schoolKeyOf(schools[0]?.id));
    setErr('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    const n = name.trim();
    if (n.length < 2) { setErr('Pick a name with at least 2 letters.'); return; }
    if (!team) { setErr('Pick your home team.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.from('profiles').insert({ id: ctx.session.user.id, display_name: n, home_team: team });
    setBusy(false);
    if (error) { setErr(friendlyError(error)); return; }
    await ctx.reloadProfile();
    onClose();
  };
  return (
    <Sheet open={open && !!ctx.session && !ctx.profile} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>Set up your fan profile</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      <Text style={[st.label, { color: ctx.c.muted }]}>NAME OTHER FANS SEE</Text>
      <TextInput value={name} onChangeText={(t) => setName(t.slice(0, 24))} placeholder="e.g. CougarDad801" placeholderTextColor={ctx.c.muted}
        style={[st.field, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line }]} />
      <Text style={[st.label, { color: ctx.c.muted, marginTop: 16 }]}>YOUR HOME TEAM</Text>
      <Text style={[st.small, { color: ctx.c.muted }]}>You can comment and post in your home team's spaces. Other fans can read along. You can switch once every 30 days.</Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {schools.map((s) => {
          const k = schoolKeyOf(s.id);
          const on = k === team;
          return (
            <Pressable key={k} onPress={() => { tap(); setTeam(k); }}
              style={[st.teamRow, { borderColor: on ? s.color : ctx.c.line, backgroundColor: ctx.c.surface }]}>
              <View style={[st.flair, { backgroundColor: s.color, paddingVertical: 4, paddingHorizontal: 8 }]}><Text style={[st.flairText, { fontSize: 12 }]}>{s.short}</Text></View>
              <Text style={[st.teamName, { color: ctx.c.fg }]}>{s.name.replace(/\s+(Football|Basketball|Men's Basketball)$/i, '')}</Text>
              <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? s.color : ctx.c.muted} />
            </Pressable>
          );
        })}
      </View>
      {err ? <Text style={[st.error, { color: ctx.c.live, marginTop: 10 }]}>{err}</Text> : null}
      <View style={{ marginTop: 16 }}><Btn label="Join Diehard chat" busy={busy} onPress={save} /></View>
    </Sheet>
  );
}

// ---------- Chat tab ----------
type Thread = { id: string; room: string; title: string; user_id: string; is_game_thread: boolean; hidden: boolean; last_post_at: string; created_at: string; author: Author; replies?: number };
type Post = { id: string; thread_id: string; user_id: string; body: string; hidden: boolean; created_at: string; author: Author };

export function ChatBoard({ team, game, color }: { team: { id: string; short: string; name: string; color: string }; game?: { id: string; name?: string; state?: string } | null; color: string }) {
  const ctx = useCommunity()!;
  const teamKey = schoolKeyOf(team.id);
  const gameRoom = game ? `${teamKey}-game-${game.id}` : '';
  const [room, setRoom] = useState(teamKey);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [mod, setMod] = useState(false);
  useEffect(() => { setRoom(teamKey); }, [teamKey]);

  const load = useCallback(async () => {
    if (!room) return;
    const { data } = await supabase.from('threads')
      .select('id,room,title,user_id,is_game_thread,hidden,last_post_at,created_at,author:profiles(display_name,home_team)')
      .eq('room', room).order('last_post_at', { ascending: false }).limit(60);
    const list = ((data as any) ?? []) as Thread[];
    if (list.length) {
      const { data: ps } = await supabase.from('posts').select('thread_id').in('thread_id', list.map((t) => t.id));
      const n: Record<string, number> = {};
      for (const p of (ps ?? []) as any[]) n[p.thread_id] = (n[p.thread_id] || 0) + 1;
      list.forEach((t) => { t.replies = Math.max(0, (n[t.id] || 0) - 1); });
    }
    setThreads(list);
    setLoading(false);
  }, [room]);

  useEffect(() => {
    setLoading(true); setThreads([]);
    load();
    const ch = supabase.channel(`threads-${room}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `room=eq.${room}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room, load]);

  // Game room: one live thread per game, opened straight away.
  const gameThread = room === gameRoom ? threads.find((t) => t.is_game_thread) ?? null : null;
  const visible = threads.filter((t) => !ctx.blocked.has(t.user_id));
  const canPost = !!ctx.profile && (room === ctx.profile.home_team || room.startsWith(`${ctx.profile.home_team}-game-`));
  const rooms = [
    { key: teamKey, label: `${team.short} fans`, icon: 'people' },
    ...(gameRoom ? [{ key: gameRoom, label: game?.state === 'in' ? '● Live game' : 'Game day', icon: 'american-football' }] : []),
  ];

  return (
    <View style={{ paddingTop: 12, gap: 12 }}>
      <View style={st.chatHead}>
        <View style={{ flex: 1 }}>
          <Text style={[st.chatTitle, { color: ctx.c.fg }]}>Chat</Text>
          <Text style={[st.small, { color: ctx.c.muted }]}>
            {ctx.profile ? <>You're <Text style={{ color: ctx.c.fg, fontFamily: fonts.bodySemi }}>{ctx.profile.display_name}</Text> · {ctx.flair(ctx.profile.home_team)?.short ?? 'fan'}</> : 'Talk with other fans. Sign in to post.'}
          </Text>
        </View>
        {ctx.profile?.is_moderator ? <Pressable onPress={() => setMod(true)} style={[st.modBtn, { borderColor: ctx.c.line }]}><Ionicons name="shield-checkmark-outline" size={16} color={ctx.c.fg} /><Text style={[st.modText, { color: ctx.c.fg }]}>Reports</Text></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {rooms.map((r) => {
          const on = r.key === room;
          return (
            <Pressable key={r.key} onPress={() => { tap(); setRoom(r.key); }}
              style={[st.roomChip, { backgroundColor: on ? ctx.c.fg : ctx.c.surface, borderColor: on ? ctx.c.fg : ctx.c.line }]}>
              <Ionicons name={r.icon as any} size={14} color={on ? ctx.c.bg : ctx.c.fg} />
              <Text style={[st.roomText, { color: on ? ctx.c.bg : ctx.c.fg }]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[st.small, { color: ctx.c.muted }]}>
        {room === gameRoom ? `One live thread for ${team.short} fans during this game.`
          : canPost || !ctx.profile ? `${team.short} fans only. Other fans can read along.`
          : `Only ${team.short} fans can post here. You can still read along.`}
      </Text>

      {room === gameRoom ? (
        <Pressable onPress={() => setOpen(gameThread ?? ({ id: '', room: gameRoom, title: `${game?.name ?? 'Game'} thread`, is_game_thread: true } as any))}
          style={[st.thread, { backgroundColor: ctx.c.surface }]}>
          <View style={[st.liveDot, { backgroundColor: game?.state === 'in' ? ctx.c.live : color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[st.threadTitle, { color: ctx.c.fg }]}>{game?.name ?? 'Game'} · live thread</Text>
            <Text style={[st.small, { color: ctx.c.muted }]}>{gameThread ? `${(gameThread.replies ?? 0) + 1} messages · ${timeAgo(new Date(gameThread.last_post_at).getTime())}` : 'Be the first to post'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={ctx.c.muted} />
        </Pressable>
      ) : (
        <>
          <Btn icon="add" label="Start a thread" onPress={() => { if (ctx.needProfile()) setComposing(true); }} disabled={!!ctx.profile && !canPost} />
          {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={ctx.c.muted} /> : null}
          {!loading && !visible.length ? <Text style={[st.empty, { color: ctx.c.muted }]}>No threads yet. Start the first one.</Text> : null}
          {visible.map((t) => (
            <Pressable key={t.id} onPress={() => { tap(); setOpen(t); }} style={({ pressed }) => [st.thread, { backgroundColor: ctx.c.surface }, pressed && { opacity: 0.85 }]}>
              <Avatar name={t.author?.display_name} homeTeam={t.author?.home_team} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[st.threadTitle, { color: t.hidden ? ctx.c.muted : ctx.c.fg }]} numberOfLines={2}>{t.title}</Text>
                <View style={st.msgHead}>
                  <Text style={[st.small, { color: ctx.c.muted }]} numberOfLines={1}>{t.author?.display_name ?? 'Fan'}</Text>
                  <Flair homeTeam={t.author?.home_team} />
                  <Text style={[st.small, { color: ctx.c.muted }]}>· {timeAgo(new Date(t.last_post_at).getTime())}</Text>
                </View>
              </View>
              <View style={st.replyCount}>
                <Ionicons name="chatbubbles-outline" size={14} color={ctx.c.muted} />
                <Text style={[st.small, { color: ctx.c.muted }]}>{t.replies ?? 0}</Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
      <NewThreadSheet open={composing} room={room} onClose={() => setComposing(false)} onCreated={(t) => { setComposing(false); load(); setOpen(t); }} />
      <ThreadScreen thread={open} canPost={canPost} onClose={() => { setOpen(null); load(); }} />
      <ModQueue open={mod} onClose={() => setMod(false)} />
    </View>
  );
}

function NewThreadSheet({ open, room, onClose, onCreated }: { open: boolean; room: string; onClose: () => void; onCreated: (t: Thread) => void }) {
  const ctx = useCommunity()!;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setTitle(''); setBody(''); setErr(''); } }, [open]);
  const create = async () => {
    const p = ctx.needProfile();
    if (!p) return;
    if (title.trim().length < 3) { setErr('Give your thread a title.'); return; }
    setBusy(true); setErr('');
    const t = await createThread(room, title.trim(), body.trim(), p.id, false);
    setBusy(false);
    if ('error' in t) { setErr(t.error); return; }
    onCreated(t.thread);
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={st.sheetHead}>
        <Text style={[st.sheetTitle, { color: ctx.c.fg }]}>New thread</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={ctx.c.fg} /></Pressable>
      </View>
      <TextInput value={title} onChangeText={(t) => setTitle(t.slice(0, 120))} placeholder="Title — e.g. Who starts at QB next week?" placeholderTextColor={ctx.c.muted}
        style={[st.field, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line, fontFamily: fonts.bodySemi }]} />
      <TextInput value={body} onChangeText={(t) => setBody(t.slice(0, 2000))} placeholder="Say more (optional)" placeholderTextColor={ctx.c.muted} multiline
        style={[st.field, { color: ctx.c.fg, backgroundColor: ctx.c.surface, borderColor: ctx.c.line, minHeight: 110, marginTop: 10, textAlignVertical: 'top' }]} />
      {err ? <Text style={[st.error, { color: ctx.c.live, marginTop: 8 }]}>{err}</Text> : null}
      <View style={{ marginTop: 14 }}><Btn label="Post thread" busy={busy} onPress={create} /></View>
    </Sheet>
  );
}

async function createThread(room: string, title: string, body: string, uid: string, isGame: boolean): Promise<{ thread: Thread } | { error: string }> {
  const { data, error } = await supabase.from('threads').insert({ room, title, user_id: uid, is_game_thread: isGame })
    .select('id,room,title,user_id,is_game_thread,hidden,last_post_at,created_at,author:profiles(display_name,home_team)').single();
  if (error) return { error: friendlyError(error) };
  if (body) {
    const r = await supabase.from('posts').insert({ thread_id: (data as any).id, user_id: uid, body });
    if (r.error) return { error: friendlyError(r.error) };
  }
  return { thread: data as any };
}

function ThreadScreen({ thread, canPost, onClose }: { thread: Thread | null; canPost: boolean; onClose: () => void }) {
  const ctx = useCommunity()!;
  const insets = useSafeAreaInsets();
  const [t, setT] = useState<Thread | null>(thread);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, { n: number; mine: boolean }>>({});
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef<FlatList<Post>>(null);
  useEffect(() => { setT(thread); setPosts([]); setText(''); setErr(''); }, [thread]);
  const tid = t?.id;

  const load = useCallback(async () => {
    if (!tid) return;
    const { data } = await supabase.from('posts')
      .select('id,thread_id,user_id,body,hidden,created_at,author:profiles(display_name,home_team)')
      .eq('thread_id', tid).order('created_at', { ascending: true }).limit(1000);
    const list = ((data as any) ?? []) as Post[];
    setPosts(list);
    if (list.length) {
      const { data: r } = await supabase.from('post_reactions').select('post_id,user_id').in('post_id', list.map((p) => p.id)).eq('kind', 'like');
      const m: Record<string, { n: number; mine: boolean }> = {};
      for (const row of (r ?? []) as any[]) { const x = m[row.post_id] ?? { n: 0, mine: false }; x.n++; if (row.user_id === ctx.profile?.id) x.mine = true; m[row.post_id] = x; }
      setLikes(m);
    }
  }, [tid, ctx.profile?.id]);

  useEffect(() => {
    if (!tid) return;
    load();
    const ch = supabase.channel(`posts-${tid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `thread_id=eq.${tid}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tid, load]);

  const send = async () => {
    const p = ctx.needProfile();
    if (!p || !text.trim() || !t) return;
    setBusy(true); setErr('');
    let threadId = t.id;
    if (!threadId) { // first message in a game thread creates it
      const made = await createThread(t.room, t.title, '', p.id, true);
      if ('error' in made) { setBusy(false); setErr(made.error); return; }
      setT(made.thread); threadId = made.thread.id;
    }
    const { error } = await supabase.from('posts').insert({ thread_id: threadId, user_id: p.id, body: text.trim().slice(0, 2000) });
    setBusy(false);
    if (error) { setErr(friendlyError(error)); return; }
    setText('');
    if (t.id) load();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const like = async (post: Post) => {
    const p = ctx.needProfile();
    if (!p) return;
    tap();
    const cur = likes[post.id] ?? { n: 0, mine: false };
    setLikes((m) => ({ ...m, [post.id]: { n: cur.n + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    if (cur.mine) await supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: p.id, kind: 'like' });
    else await supabase.from('post_reactions').insert({ post_id: post.id, user_id: p.id, kind: 'like' });
  };

  const visible = posts.filter((p) => !ctx.blocked.has(p.user_id));
  const mineThread = t?.user_id && t.user_id === ctx.profile?.id;
  return (
    <Modal visible={!!thread} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: ctx.c.bg }}>
        <View style={[st.threadBar, { paddingTop: insets.top + 8, borderBottomColor: ctx.c.line }]}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Back"><Ionicons name="chevron-back" size={26} color={ctx.c.fg} /></Pressable>
          <Text style={[st.threadBarTitle, { color: ctx.c.fg }]} numberOfLines={2}>{t?.title}</Text>
          {t?.id ? (
            <Pressable hitSlop={10} accessibilityLabel={mineThread ? 'Delete thread' : 'Report thread'}
              onPress={async () => {
                if (mineThread || ctx.profile?.is_moderator) { await supabase.from('threads').delete().eq('id', t.id); onClose(); }
                else ctx.openReport({ type: 'thread', id: t.id, userId: t.user_id, name: t.author?.display_name });
              }}>
              <Ionicons name={mineThread || ctx.profile?.is_moderator ? 'trash-outline' : 'flag-outline'} size={20} color={ctx.c.muted} />
            </Pressable>
          ) : <View style={{ width: 20 }} />}
        </View>
        <FlatList ref={listRef} data={visible} keyExtractor={(p) => p.id} contentContainerStyle={{ paddingVertical: 10 }}
          ListEmptyComponent={<Text style={[st.empty, { color: ctx.c.muted }]}>{t?.is_game_thread ? 'Nobody has posted yet. Get it started.' : 'No replies yet.'}</Text>}
          renderItem={({ item: p }) => (
            <MessageRow userId={p.user_id} author={p.author} at={p.created_at} body={p.body} hidden={p.hidden}
              likes={likes[p.id]?.n} liked={likes[p.id]?.mine} onLike={() => like(p)}
              onReport={() => ctx.openReport({ type: 'post', id: p.id, userId: p.user_id, name: p.author?.display_name })}
              onDelete={p.user_id === ctx.profile?.id || ctx.profile?.is_moderator ? async () => { await supabase.from('posts').delete().eq('id', p.id); load(); } : undefined} />
          )} />
        <View style={{ paddingBottom: insets.bottom }}>
          <Composer placeholder={t?.is_game_thread ? 'React to the game…' : 'Reply…'} value={text} onChange={setText} onSend={send} busy={busy} error={err} max={2000}
            locked={!ctx.session ? 'signin' : !ctx.profile ? 'join' : !canPost ? 'Only this team’s fans can post here. You can still read along.' : ''} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- moderator review ----------
function ModQueue({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ctx = useCommunity()!;
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(200);
    const groups: Record<string, any> = {};
    for (const r of (data ?? []) as any[]) {
      const k = `${r.target_type}:${r.target_id}`;
      groups[k] = groups[k] ?? { type: r.target_type, id: r.target_id, reasons: [], count: 0 };
      groups[k].count++; groups[k].reasons.push(r.reason);
    }
    const list = Object.values(groups);
    for (const g of list) {
      const table = g.type === 'comment' ? 'comments' : g.type === 'post' ? 'posts' : g.type === 'thread' ? 'threads' : null;
      if (!table) continue;
      const { data: row } = await supabase.from(table).select('*, author:profiles(display_name,home_team)').eq('id', g.id).maybeSingle();
      g.row = row;
    }
    setItems(list);
    setLoading(false);
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const act = async (g: any, action: 'hide' | 'keep' | 'delete') => {
    const table = g.type === 'comment' ? 'comments' : g.type === 'post' ? 'posts' : 'threads';
    if (action === 'delete') await supabase.from(table).delete().eq('id', g.id);
    else await supabase.from(table).update({ hidden: action === 'hide' }).eq('id', g.id);
    await supabase.from('reports').update({ resolved: true }).match({ target_type: g.type, target_id: g.id });
    load();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: ctx.c.bg }}>
        <View style={[st.threadBar, { paddingTop: insets.top + 8, borderBottomColor: ctx.c.line }]}>
          <Pressable onPress={onClose} hitSlop={10}><Ionicons name="chevron-back" size={26} color={ctx.c.fg} /></Pressable>
          <Text style={[st.threadBarTitle, { color: ctx.c.fg }]}>Reports to review</Text>
          <Pressable onPress={load} hitSlop={10}><Ionicons name="refresh" size={20} color={ctx.c.muted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
          {loading ? <ActivityIndicator color={ctx.c.muted} /> : null}
          {!loading && !items.length ? <Text style={[st.empty, { color: ctx.c.muted }]}>Nothing to review. 🎉</Text> : null}
          {items.map((g) => (
            <View key={`${g.type}:${g.id}`} style={[st.thread, { backgroundColor: ctx.c.surface, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
              <Text style={[st.small, { color: ctx.c.live, fontFamily: fonts.bodySemi }]}>
                {g.count} report{g.count > 1 ? 's' : ''} · {[...new Set(g.reasons)].join(', ').replace(/_/g, ' ')} · {g.type}
              </Text>
              <View style={st.msgHead}>
                <Text style={[st.msgName, { color: ctx.c.fg }]}>{g.row?.author?.display_name ?? 'Removed'}</Text>
                <Flair homeTeam={g.row?.author?.home_team} />
              </View>
              <Text style={[st.msgBody, { color: ctx.c.fg }]}>{g.row?.body ?? g.row?.title ?? '(already deleted)'}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><Btn kind="ghost" label="Keep" onPress={() => act(g, 'keep')} /></View>
                <View style={{ flex: 1 }}><Btn kind="dark" label="Hide" onPress={() => act(g, 'hide')} /></View>
                <View style={{ flex: 1 }}><Btn label="Delete" onPress={() => act(g, 'delete')} /></View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---------- styles ----------
const st = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8, maxHeight: '92%' },
  grab: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: 20 },
  sheetSub: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18, marginBottom: 6 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  empty: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', marginTop: 24, marginBottom: 12 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 14, marginTop: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  tabText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  eye: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  link: { fontFamily: fonts.bodySemi, fontSize: 13.5, textDecorationLine: 'underline' },
  btn: { height: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16 },
  flair: { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5 },
  flairText: { color: '#fff', fontFamily: fonts.monoBold, letterSpacing: 0.4 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: fonts.bodyBold },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingTop: 4, marginTop: 6 },
  barBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 8, minHeight: 36 },
  barCount: { fontFamily: fonts.bodySemi, fontSize: 13 },
  picker: { flexDirection: 'row', gap: 6, marginHorizontal: 12, marginTop: 2, marginBottom: 4, padding: 6, borderRadius: 14, alignSelf: 'flex-start' },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pickCount: { fontFamily: fonts.bodySemi, fontSize: 12 },
  msg: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  msgHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  msgName: { fontFamily: fonts.bodySemi, fontSize: 14, flexShrink: 1 },
  msgTime: { fontFamily: fonts.body, fontSize: 12 },
  msgBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, marginTop: 2 },
  msgHidden: { fontFamily: fonts.bodyMedium, fontSize: 11.5, marginTop: 2 },
  msgActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  msgAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  msgActionText: { fontFamily: fonts.bodySemi, fontSize: 12.5 },
  menu: { marginTop: 6, borderWidth: 1, borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start', minWidth: 200 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  menuText: { fontFamily: fonts.bodyMedium, fontSize: 14.5 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 6 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, maxHeight: 120, fontFamily: fonts.body, fontSize: 15.5 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  lockText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, textAlign: 'center', paddingVertical: 8 },
  reason: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  reasonText: { fontFamily: fonts.bodyMedium, fontSize: 15.5 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1.5, borderRadius: 14 },
  teamName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15.5 },
  chatHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatTitle: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.5 },
  modBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  modText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  roomChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  roomText: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  threadTitle: { fontFamily: fonts.bodySemi, fontSize: 15.5, lineHeight: 20, marginBottom: 3 },
  replyCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  threadBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  threadBarTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16.5 },
});

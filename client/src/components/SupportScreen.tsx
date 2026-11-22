import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useAuth } from '../features/auth/clerkHooks';
import { apiRequest } from '../lib/api';
import { buildSupportPayload, loadSupport, submitSupport, type SupportKind, type SupportTicket } from '../../../shared/support';

type Colors = { background: string; surface: string; text: string; muted: string; border: string; primary: string; onPrimary: string; error: string };
export default function SupportScreen({ app, colors: c }: { app: string; colors: Colors }) {
  const { kind: requestedKind } = useLocalSearchParams<{ kind?: string }>();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [kind, setKind] = useState<SupportKind>(requestedKind === 'problem' ? 'problem' : 'feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [history, setHistory] = useState<{ owner: string; items: SupportTicket[]; error: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const locked = useRef(false);
  const alive = useRef(true);
  const sequence = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!userId || !isSignedIn) return;
    const attempt = ++sequence.current;
    await Promise.resolve();
    if (signal?.aborted || !alive.current) return;
    try {
      const token = await getToken();
      const items = await loadSupport(apiRequest, token || '', signal);
      if (alive.current && !signal?.aborted && attempt === sequence.current) setHistory({ owner: userId, items, error: '' });
    } catch (cause) {
      if (alive.current && !signal?.aborted && attempt === sequence.current) setHistory({ owner: userId, items: [], error: cause instanceof Error ? cause.message : 'Unable to load reports.' });
    } finally { if (alive.current && attempt === sequence.current) setRefreshing(false); }
  }, [getToken, isSignedIn, userId]);
  useEffect(() => {
    const controller = new AbortController();
    // Start after effect setup, so cleanup can cancel even an immediate token response.
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return refresh(controller.signal); });
    return () => controller.abort();
  }, [refresh]);
  async function send() {
    if (locked.current) return;
    setError(''); setReceipt('');
    try { buildSupportPayload({ kind, subject, message, steps }, app, Platform.OS); }
    catch (cause) { setError((cause as Error).message); return; }
    if (!isSignedIn) { setError('Please sign in before sending. Your message has not been sent.'); return; }
    locked.current = true; setBusy(true);
    try {
      const token = await getToken();
      const ticket = await submitSupport(apiRequest, token || '', { kind, subject, message, steps }, app, Platform.OS);
      if (!alive.current) return;
      setReceipt(ticket._id); setSubject(''); setMessage(''); setSteps('');
      void refresh();
    } catch (cause) {
      if (alive.current) setError(`${cause instanceof Error ? cause.message : 'Unable to send your report.'} Your draft is kept here. If the connection timed out, refresh My reports before sending again.`);
    } finally { locked.current = false; if (alive.current) setBusy(false); }
  }
  const current = history?.owner === userId ? history : null;
  const inputStyle = [s.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }];
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
        <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}><Text style={{ color: c.primary, fontWeight: '700' }}>← Back</Text></Pressable>
        <Text style={[s.title, { color: c.text }]}>Help & feedback</Text>
        <Text style={[s.copy, { color: c.muted }]}>Share feedback with customer support or tell us about a problem in NearBy.</Text>
        <View style={s.choices}>{(['feedback', 'problem'] as const).map(value => <Pressable key={value} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: value === kind }} onPress={() => { setKind(value); setReceipt(''); setError(''); }} style={[s.choice, { borderColor: c.border, backgroundColor: value === kind ? c.primary : c.surface }]}><Text style={{ color: value === kind ? c.onPrimary : c.text, fontWeight: '700', textAlign: 'center' }}>{value === 'feedback' ? 'Feedback' : 'Report a problem'}</Text></Pressable>)}</View>
        <Text style={[s.label, { color: c.text }]}>Subject</Text>
        <TextInput accessibilityLabel="Subject" editable={!busy} maxLength={140} value={subject} onChangeText={setSubject} placeholder={kind === 'problem' ? 'What went wrong?' : 'What would you like to share?'} placeholderTextColor={c.muted} style={inputStyle} />
        <Text style={[s.label, { color: c.text }]}>{kind === 'problem' ? 'Describe the problem' : 'Your feedback'}</Text>
        <TextInput accessibilityLabel={kind === 'problem' ? 'Describe the problem' : 'Your feedback'} editable={!busy} multiline textAlignVertical="top" maxLength={3000} value={message} onChangeText={setMessage} placeholder="Tell us what happened or what we could improve." placeholderTextColor={c.muted} style={[inputStyle, s.message]} />
        <Text style={{ color: c.muted, textAlign: 'right', fontSize: 12 }}>{message.length}/3000</Text>
        {kind === 'problem' ? <><Text style={[s.label, { color: c.text }]}>Steps to reproduce (optional)</Text><TextInput accessibilityLabel="Steps to reproduce" editable={!busy} multiline textAlignVertical="top" maxLength={500} value={steps} onChangeText={setSteps} placeholder="1. Open… 2. Tap… 3. The issue appears…" placeholderTextColor={c.muted} style={[inputStyle, { minHeight: 100 }]} /></> : null}
        <Text style={[s.copy, { color: c.muted }]}>Includes the app name and platform ({app} · {Platform.OS}). Please do not include passwords, payment details or verification codes.</Text>
        {error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{error}</Text> : null}
        {receipt ? <View style={[s.card, { borderColor: c.border, backgroundColor: c.surface }]}><Text accessibilityLiveRegion="polite" style={{ color: c.text, fontWeight: '700' }}>Sent to support</Text><Text selectable style={{ color: c.muted }}>Reference: {receipt}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !isLoaded, busy }} disabled={busy || !isLoaded} onPress={() => void send()} style={[s.send, { backgroundColor: c.primary, opacity: busy ? 0.65 : 1 }]}>{busy ? <ActivityIndicator color={c.onPrimary} /> : <Text style={{ color: c.onPrimary, fontWeight: '700' }}>{kind === 'problem' ? 'Send problem report' : 'Send feedback'}</Text>}</Pressable>
        {!isSignedIn ? <View><Text style={[s.copy, { color: c.muted }]}>You can write a draft here. Sign in to your account before sending it.</Text><Pressable accessibilityRole="button" style={s.back} onPress={() => router.push({ pathname: '/login', params: { returnTo: 'support' } } as Href)}><Text style={{ color: c.primary, fontWeight: '700' }}>Sign in to send</Text></Pressable></View> : <>
          <View style={s.row}><Text style={[s.heading, { color: c.text }]}>My reports</Text><Pressable accessibilityRole="button" disabled={refreshing} onPress={() => { setRefreshing(true); void refresh(); }} style={s.back}><Text style={{ color: c.primary }}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text></Pressable></View>
          {!current ? <ActivityIndicator color={c.primary} /> : current.error ? <Text accessibilityRole="alert" style={{ color: c.error }}>{current.error}</Text> : current.items.length === 0 ? <Text style={{ color: c.muted }}>You have not sent any reports yet.</Text> : current.items.map(ticket => <View key={ticket._id} style={[s.card, { borderColor: c.border, backgroundColor: c.surface }]}><Text style={{ color: c.text, fontWeight: '700' }}>{ticket.subject}</Text><Text style={{ color: c.muted }}>Status: {(ticket.status || 'open').replace(/_/g, ' ')}</Text><Text selectable style={{ color: c.muted, fontSize: 11 }}>Reference: {ticket._id}</Text></View>)}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ page: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: 24, gap: 12, paddingBottom: 40 }, back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, title: { fontSize: 27, fontWeight: '800' }, heading: { fontSize: 20, fontWeight: '700' }, copy: { fontSize: 13, lineHeight: 20 }, label: { fontWeight: '700', marginTop: 5 }, choices: { flexDirection: 'row', gap: 10, marginVertical: 8 }, choice: { flex: 1, minHeight: 48, justifyContent: 'center', padding: 12, borderWidth: 1, borderRadius: 12 }, input: { minHeight: 48, padding: 14, borderWidth: 1, borderRadius: 12, fontSize: 15 }, message: { minHeight: 150 }, send: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 14 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }, card: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 7 } });

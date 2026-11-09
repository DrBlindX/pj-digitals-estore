import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useClerk, useUser } from './clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import type { PropsWithChildren } from 'react';

export default function AccountSettings() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { palette: p } = useAdminTheme();
  const C = { red: p.terracotta };
  const S = { small: { color: p.muted, fontSize: 13 }, title: { color: p.text, fontSize: 24, fontWeight: '800' as const } };
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const refresh = useCallback(async () => {
    try { await user?.reload(); }
    catch { if (mounted.current) setMessage('Unable to refresh your account. Try Refresh profile.'); }
  }, [user]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  async function manage() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setMessage('');
    try {
      const url = new URL(clerk.buildUserProfileUrl());
      if (url.protocol !== 'https:') throw new Error('Clerk account settings are unavailable.');
      await WebBrowser.openBrowserAsync(url.href);
      await refresh();
    } catch (cause) { if (mounted.current) setMessage(cause instanceof Error ? cause.message : 'Unable to open account settings.'); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  if (!isLoaded) return <Text style={S.small}>Loading account…</Text>;
  if (!user) return <Text style={S.small}>Sign in to manage your account.</Text>;
  return <Card>
    <View style={{ gap: 16 }}>
      {user.imageUrl ? <Image source={{ uri: user.imageUrl }} accessibilityLabel="Your profile photo" style={{ width: 76, height: 76, borderRadius: 38 }} /> : null}
      <Text style={S.title}>{user.fullName || user.username || 'Your account'}</Text>
      <Text style={S.small}>{user.primaryEmailAddress?.emailAddress}</Text>
      <Text style={[S.small, { lineHeight: 20 }]}>Manage your photo, name, email and sign-in security in Clerk. Settings open in the browser; you may need to sign in again.</Text>
      <Button disabled={busy} label={busy ? 'Opening settings…' : 'Manage profile & security'} onPress={() => void manage()} />
      <Button secondary label="Refresh profile" onPress={() => { setMessage(''); void refresh(); }} />
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: C.red, fontSize: 12, lineHeight: 20 }}>{message}</Text> : null}
    </View>
  </Card>;
}

function Card({ children }: PropsWithChildren) {
 const { palette: p } = useAdminTheme();
 return <View style={{ padding: 20, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 16 }}>{children}</View>;
}
function Button({ label, disabled = false, secondary = false, onPress }: { label: string; disabled?: boolean; secondary?: boolean; onPress: () => void }) {
 const { palette: p } = useAdminTheme();
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ padding: 14, borderRadius: 10, backgroundColor: secondary ? p.soft : p.primary, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: secondary ? p.primaryText : p.onPrimary, fontWeight: '700', textAlign: 'center' }}>{label}</Text></Pressable>;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useClerk, useUser } from './clerkHooks';
import { Button, Card, useShopUI } from '../components/ShopUI';

export default function AccountSettings() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { C, S } = useShopUI();
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

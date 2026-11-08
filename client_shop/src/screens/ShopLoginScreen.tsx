import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import BrandLogo from '../components/BrandLogo';
import { useShopUI } from '../components/ShopUI';

export function ShopLoginScreen() {
  const { C, S } = useShopUI();
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function signIn() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await startHostedAuth({ mode: 'sign-in' });
      if (mounted.current && !result.createdSessionId) setError(result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss' ? 'Sign-in was cancelled. You can try again.' : 'Sign-in did not finish. Please try again.');
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Unable to open Clerk sign-in.');
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
    <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 }}>
      <BrandLogo size={64} /><Text style={S.title}>NearBy Shop</Text><Text style={S.subtitle}>Sign in with your Clerk account.</Text>
      <View style={[S.card, { padding: 24, gap: 18 }]}>
        <Text style={S.name}>Welcome back.</Text><Text style={S.small}>Continue to Clerk to sign in and complete any verification steps.</Text>
        {error ? <Text accessibilityRole="alert" style={{ color: C.red, lineHeight: 20 }}>{error}</Text> : null}
        <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} onPress={() => void signIn()} style={[S.btn, { minHeight: 48, opacity: busy ? 0.6 : 1 }]}>{busy ? <ActivityIndicator color={C.onPrimary} /> : <Text style={S.btnText}>Continue with Clerk</Text>}</Pressable>
      </View>
      <Text style={[S.small, { lineHeight: 19 }]}>Your account must be linked to an approved shop to access shop data.</Text>
    </View>
  </ScrollView></SafeAreaView>;
}

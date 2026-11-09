import { useEffect, useRef, useState } from 'react';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { Pressable, ScrollView, Text, View } from 'react-native';
import BrandLogo from '../components/BrandLogo';
import { useAdminTheme } from '../context/AdminTheme';
export default function AdminLogin() {
  const { palette: p } = useAdminTheme();
  const { startHostedAuth } = useHostedAuth();
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function login() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await startHostedAuth({ mode: 'sign-in' });
      if (mounted.current && !result.createdSessionId) setError('Sign-in did not finish. Please try again.');
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Unable to sign in.'); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <ScrollView style={{ flex: 1, backgroundColor: p.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}><View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 20, padding: 24, borderWidth: 1, borderColor: p.border, borderRadius: 16, backgroundColor: p.surface }}>
    <BrandLogo size={64} /><Text style={{ color: p.primaryText, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>NEARBY · ADMIN</Text><Text style={{ color: p.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.8, lineHeight: 38 }}>Welcome back.</Text>
    <Text style={{ color: p.muted, lineHeight: 22 }}>Sign in with Clerk. Your account needs admin access to continue.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void login()} style={{ padding: 16, borderRadius: 10, backgroundColor: p.primary }}><Text style={{ color: p.onPrimary, textAlign: 'center' }}>{busy ? 'Signing in…' : 'Continue with Clerk'}</Text></Pressable>
  </View></ScrollView>;
}

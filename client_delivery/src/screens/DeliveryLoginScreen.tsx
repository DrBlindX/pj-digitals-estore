import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/clerkHooks';
import BrandLogo from '../components/BrandLogo';
import { C } from '../theme';
import { useHostedAuth } from '@clerk/expo/hosted-auth';

export default function DeliveryLoginScreen() {
  const { isLoaded } = useAuth();
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  async function signIn() {
    if (!isLoaded || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await startHostedAuth({ mode: 'sign-in' });
      if (!result.createdSessionId) setError(result.authSessionResult?.type === 'cancel' ? 'Sign-in cancelled. Try again when ready.' : 'Sign-in did not finish. Please try again.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open secure sign-in. Try again.');
    } finally { pending.current = false; setBusy(false); }
  }

  return <SafeAreaView style={s.screen}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}><View style={s.content}>
      <BrandLogo size={64} />
      <Text style={s.brand}>NEARBY · DELIVERY</Text>
      <Text style={s.title}>Welcome back.</Text>
      <Text style={s.copy}>Sign in to your delivery account with Clerk.</Text>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !isLoaded || busy, busy }} disabled={!isLoaded || busy} onPress={() => void signIn()} style={[s.button, (!isLoaded || busy) && { opacity: 0.65 }]}>
        {busy ? <ActivityIndicator color={C.onPrimary} /> : <Text style={s.buttonText}>{isLoaded ? 'Continue with Clerk' : 'Loading secure sign-in…'}</Text>}
      </Pressable>
    </View></ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 20, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 24 },
  brand: { color: C.primaryText, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  title: { color: C.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.8, lineHeight: 38 },
  copy: { color: C.muted, fontSize: 14, lineHeight: 22 },
  error: { color: C.red, textAlign: 'center', lineHeight: 20 },
  button: { width: '100%', minHeight: 48, backgroundColor: C.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: C.onPrimary, fontWeight: '800' },
});

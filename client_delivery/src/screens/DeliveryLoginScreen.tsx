import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
    <View style={s.content}>
      <BrandLogo size={68} />
      <Text style={s.brand}>NEARBY · DELIVERY</Text>
      <Text style={s.title}>Welcome back.</Text>
      <Text style={s.copy}>Sign in to your delivery account with Clerk.</Text>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !isLoaded || busy, busy }} disabled={!isLoaded || busy} onPress={() => void signIn()} style={[s.button, (!isLoaded || busy) && { opacity: 0.65 }]}>
        {busy ? <ActivityIndicator color={C.onPrimary} /> : <Text style={s.buttonText}>{isLoaded ? 'Continue with Clerk' : 'Loading secure sign-in…'}</Text>}
      </Pressable>
    </View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', backgroundColor: C.bg, padding: 24 },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderTopWidth: 4, borderTopColor: C.primary, borderRadius: 16, padding: 28 },
  brand: { color: C.primaryText, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  title: { color: C.text, fontSize: 30, fontWeight: '800', marginTop: 6 },
  copy: { color: C.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 8 },
  error: { color: C.red, textAlign: 'center', lineHeight: 20 },
  button: { width: '100%', minHeight: 48, backgroundColor: C.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: C.onPrimary, fontWeight: '800' },
});

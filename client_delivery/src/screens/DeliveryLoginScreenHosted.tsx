import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/clerkHooks';
import BrandLogo from '../components/BrandLogo';
import { C } from '../theme';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';

export default function DeliveryLoginScreen() {
  const { isLoaded } = useAuth();
  const { hostedSignIn, startHostedSignIn } = useDeliveryAuth();
  const working = hostedSignIn.pending;
  const signInError = hostedSignIn.error;

  return <SafeAreaView style={s.screen}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}><View style={s.content}>
      <BrandLogo size={64} />
      <Text style={s.brand}>NEARBY · DELIVERY</Text>
      <Text style={s.title}>Welcome back.</Text>
      <Text style={s.copy}>Sign in to your delivery account with Clerk.</Text>
      {signInError ? <Text accessibilityRole="alert" style={s.error}>{signInError}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !isLoaded || working, busy: working }} disabled={!isLoaded || working} onPress={() => void startHostedSignIn()} style={[s.button, (!isLoaded || working) && { opacity: 0.65 }]}>
        {working ? <ActivityIndicator color={C.onPrimary} /> : <Text style={s.buttonText}>{isLoaded ? 'Continue with Clerk' : 'Loading secure sign-in…'}</Text>}
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

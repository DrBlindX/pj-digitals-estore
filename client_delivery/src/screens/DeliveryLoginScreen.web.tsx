import { SignIn } from '@clerk/react';
import { StyleSheet, Text, View } from 'react-native';
import BrandLogo from '../components/BrandLogo';
import { C } from '../theme';

export default function DeliveryLoginScreen() {
  return <View style={s.screen}>
    <View style={s.brand}>
      <BrandLogo size={64} />
      <Text style={s.kicker}>NEARBY · DELIVERY</Text>
      <Text style={s.title}>Welcome back.</Text>
    </View>
    <SignIn routing="hash" forceRedirectUrl="/" appearance={{
      variables: { colorPrimary: C.primary, colorBackground: C.surface, colorForeground: C.text, colorMutedForeground: C.muted, colorInputForeground: C.text, borderRadius: '0.75rem' },
      elements: { rootBox: { width: '100%', maxWidth: '420px' }, cardBox: { width: '100%', boxShadow: 'none' }, card: { boxShadow: 'none', borderColor: C.border }, footerAction: { display: 'none' } },
    }} />
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, width: '100%', minHeight: '100%', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24, backgroundColor: C.bg },
  brand: { alignItems: 'center', gap: 10 },
  kicker: { color: C.primaryText, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: C.text, fontSize: 28, fontWeight: '800' },
});

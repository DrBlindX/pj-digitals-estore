import { UserProfile } from '@clerk/react';
import { Text } from 'react-native';
import { useShopAuth } from '../context/ShopAuthContext';
import { useShopUI } from '../components/ShopUI';

export default function AccountSettings() {
  const { account, ready } = useShopAuth();
  const { C } = useShopUI();
  if (!ready) return <Text style={{ color: C.muted }}>Loading account…</Text>;
  if (!account) return <Text style={{ color: C.text }}>Sign in to manage your account.</Text>;
  return <UserProfile routing="path" path="/account" fallback={<Text style={{ color: C.muted }}>Loading account settings…</Text>} appearance={{
    variables: { colorPrimary: C.blue, colorBackground: C.panel, colorForeground: C.text, colorMutedForeground: C.muted, borderRadius: '0.75rem' },
    elements: {
      rootBox: { width: '100%', maxWidth: '1000px', minWidth: 0 }, cardBox: { width: '100%', maxWidth: '100%', minWidth: 0 },
      card: { width: '100%', minWidth: 0, boxSizing: 'border-box' }, formFieldInput: { fontSize: '16px', backgroundColor: C.bg, color: C.text },
    },
  }} />;
}

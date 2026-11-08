import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';
import { C } from '../theme';

export default function HostedAuthCallback() {
  const { partner, ready } = useDeliveryAuth();
  useEffect(() => { if (ready && partner) router.dismissTo('/'); }, [ready, partner?.id]);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg, padding: 24 }}>
    {!ready || partner ? <><ActivityIndicator color={C.primary} /><Text style={{ color: C.muted }}>Finishing sign-in…</Text></> : <>
      <Text style={{ color: C.text, textAlign: 'center' }}>Sign-in didn’t finish. Return and try again.</Text>
      <Text onPress={() => router.dismissTo('/')} style={{ color: C.primaryText, padding: 12 }}>Back to sign-in</Text>
    </>}
  </View>;
}

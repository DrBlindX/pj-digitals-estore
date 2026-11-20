import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';
import { C } from '../theme';

export default function HostedAuthCallback() {
  const { partner, ready, hostedSignIn } = useDeliveryAuth();
  const [takingLonger, setTakingLonger] = useState(false);
  const signedIn = !!partner;
  useEffect(() => {
    if (ready && (signedIn || !hostedSignIn.pending)) router.replace('/');
  }, [ready, signedIn, hostedSignIn.pending]);
  useEffect(() => {
    const timer = setTimeout(() => setTakingLonger(true), 30000);
    return () => clearTimeout(timer);
  }, []);
  const waiting = !ready || !!partner || hostedSignIn.pending;
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg, padding: 24 }}>
    {waiting ? <>
      <ActivityIndicator color={C.primary} />
      <Text style={{ color: C.muted, textAlign: 'center' }}>{takingLonger ? 'Sign-in is taking longer than expected. Check your connection.' : 'Finishing sign-in…'}</Text>
    </> : <Text accessibilityRole="alert" style={{ color: C.text, textAlign: 'center' }}>{hostedSignIn.error || 'Returning to sign-in…'}</Text>}
    {!waiting || takingLonger ? <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={{ padding: 12 }}><Text style={{ color: C.primaryText }}>Back to sign-in</Text></Pressable> : null}
  </View>;
}

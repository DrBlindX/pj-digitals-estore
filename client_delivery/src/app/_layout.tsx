import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DeliveryAuthProvider } from '../context/DeliveryAuthContext';
import DeliveryClerkProvider from '../auth/DeliveryClerkProvider';
import { DeliveryLoadingScreen } from '../components/DeliveryLoadingScreen';
import { C } from '../theme';

export default function RootLayout() {
  const { height: viewportHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => setLoading(false), []);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}><Text style={{ color: C.text }}>Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in client_delivery/.env.local and restart Expo.</Text></View>;
  return <DeliveryClerkProvider publishableKey={publishableKey}><DeliveryAuthProvider><SafeAreaProvider>
    <View style={{ flex: 1, height: viewportHeight, maxHeight: viewportHeight, minHeight: 0, overflow: 'hidden' }}>
      <View style={{ flex: 1 }} pointerEvents={loading ? 'none' : 'auto'} accessibilityElementsHidden={loading} importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}><Stack.Screen name="hosted-auth-callback" options={{ title: 'Completing sign-in' }} /></Stack>
      </View>
      {loading ? <DeliveryLoadingScreen onFinish={finishLoading} /> : null}
    </View>
  </SafeAreaProvider></DeliveryAuthProvider></DeliveryClerkProvider>;
}

import AdminClerkProvider from '../auth/AdminClerkProvider';
import AdminAccess from '../auth/AdminAccess';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AdminLoadingScreen } from '../components/AdminLoadingScreen';
import { AdminThemeProvider, useAdminTheme } from '../context/AdminTheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerConnection } from '../components/ServerConnection';

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) throw new Error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in client_admin/.env.local and restart Expo.');
  return <AdminThemeProvider><AdminClerkProvider publishableKey={publishableKey}><AdminRoot /></AdminClerkProvider></AdminThemeProvider>;
}
function AdminRoot() {
  const { mode } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => setLoading(false), []);
  return <SafeAreaProvider><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><View style={{ flex: 1 }}>
    <View style={{ flex: 1 }} pointerEvents={loading ? 'none' : 'auto'} accessibilityElementsHidden={loading} importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}><ServerConnection><AdminAccess><Stack screenOptions={{ headerShown: false, title: 'NearBy Admin' }} /></AdminAccess></ServerConnection></View>
    {loading ? <AdminLoadingScreen onFinish={finishLoading} /> : null}
  </View></SafeAreaProvider>;
}

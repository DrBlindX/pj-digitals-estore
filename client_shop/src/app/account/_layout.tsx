import { Slot } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import AccountSettings from '../../auth/AccountSettings';
import { useUser } from '../../auth/clerkHooks';
import { Page, useShopUI } from '../../components/ShopUI';

// Keep Clerk mounted while Profile and Security navigate to their subroutes.
export default function AccountLayout() {
  const { user } = useUser();
  const { C } = useShopUI();
  const [error, setError] = useState('');
  return <Page title="Account settings" subtitle="Your Clerk profile and sign-in security." onRefresh={() => { setError(''); void user?.reload().catch(() => setError('Unable to refresh your account. Try again.')); }}>
    {error ? <Text style={{ color: C.red, marginBottom: 12 }}>{error}</Text> : null}
    <AccountSettings />
    <Slot />
  </Page>;
}

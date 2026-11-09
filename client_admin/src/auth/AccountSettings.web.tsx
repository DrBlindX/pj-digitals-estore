import { UserProfile } from '@clerk/react';
import { Text } from 'react-native';
import { useUser } from './clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
export default function AccountSettings() {
 const { user, isLoaded } = useUser();
 const { palette: p } = useAdminTheme();
 if (!isLoaded) return <Text style={{ color: p.muted }}>Loading account…</Text>;
 if (!user) return <Text style={{ color: p.text }}>Sign in to manage your account.</Text>;
 return <UserProfile routing="path" path="/account" fallback={<Text style={{ color: p.muted }}>Loading account settings…</Text>} appearance={{
  variables: { colorPrimary: p.primary, borderRadius: '0.75rem' },
  elements: { rootBox: { width: '100%', maxWidth: '1000px', minWidth: 0 }, cardBox: { width: '100%', maxWidth: '100%', minWidth: 0 }, card: { width: '100%', minWidth: 0, boxSizing: 'border-box', backgroundColor: p.surface, color: p.text }, formFieldInput: { fontSize: '16px', backgroundColor: p.background, color: p.text } },
 }} />;
}

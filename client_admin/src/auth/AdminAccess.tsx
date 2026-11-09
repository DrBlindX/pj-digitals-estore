import { useEffect, useState, type PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth, useClerk } from './clerkHooks';
import AdminLogin from './AdminLogin';
import { useAdminTheme } from '../context/AdminTheme';
import { apiRequest } from '../lib/api';
export default function AdminAccess({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const clerk = useClerk();
  const { palette: p } = useAdminTheme();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner: string; allowed: boolean; error: string } | null>(null);
  const [logoutError, setLogoutError] = useState('');
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again.');
        const response = await apiRequest('/api/admin/stats', { signal: controller.signal, headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const result = await response.json();
        if (result?.success !== true || !result.data || typeof result.data.totalUsers !== 'number') throw new Error('Unable to verify admin access.');
        if (!controller.signal.aborted) setState({ owner: userId, allowed: true, error: '' });
      } catch (cause) { if (!controller.signal.aborted) setState({ owner: userId, allowed: false, error: cause instanceof Error ? cause.message : 'Unable to verify admin access.' }); }
    })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, userId, getToken, attempt]);
  const current = state?.owner === userId ? state : null;
  if (isLoaded && !isSignedIn) return <AdminLogin />;
  if (isLoaded && isSignedIn && current?.allowed) return children;
  return <View style={{ flex: 1, backgroundColor: p.background, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 18 }}>
    <Text accessibilityLiveRegion="polite" style={{ color: current?.error ? p.terracotta : p.text }}>{current?.error || 'Verifying admin access…'}</Text>
    {current?.error ? <Pressable accessibilityRole="button" onPress={() => { setState(null); setAttempt(value => value + 1); }}><Text style={{ color: p.primaryText }}>Retry</Text></Pressable> : null}
    {isSignedIn ? <Pressable accessibilityRole="button" onPress={() => { setLogoutError(''); void clerk.signOut().catch(() => setLogoutError('Unable to sign out. Please try again.')); }}><Text style={{ color: p.primaryText }}>Sign out</Text></Pressable> : null}
    {logoutError ? <Text style={{ color: p.terracotta }}>{logoutError}</Text> : null}
  </View>;
}

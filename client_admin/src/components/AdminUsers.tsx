import AdminUserRole from './AdminUserRole';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readAdminUsers, type AdminUser } from '../services/users';
export default function AdminUsers() {
 const { userId, getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [page, setPage] = useState(1);
 const [attempt, setAttempt] = useState(0);
 const key = `${userId}:${page}:${attempt}`;
 const [state, setState] = useState<{ key: string; users: AdminUser[]; pages: number; error: string } | null>(null);
 useEffect(() => {
  if (!userId) return;
  const controller = new AbortController();
  void (async () => {
   try {
    const token = await getToken();
    if (controller.signal.aborted) return;
    if (!token) throw new Error('Please sign in again.');
    const data = await readAdminUsers(page, token, controller.signal);
    if (!controller.signal.aborted) setState({ key, ...data, error: '' });
   } catch (cause) { if (!controller.signal.aborted) setState({ key, users: [], pages: 0, error: cause instanceof Error ? cause.message : 'Unable to load users.' }); }
  })();
  return () => controller.abort();
 }, [userId, getToken, page, key]);
 const current = state?.key === key ? state : null;
 const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800', fontSize: 20 }}>Users and roles</Text>
  <Text style={{ color: p.muted }}>Manage user access across NearBy.</Text>
  {!current ? <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>Loading users…</Text> : current.error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{current.error}</Text> : current.users.length ? current.users.map(user => <View key={user.id} style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 14, padding: 16, gap: 8 }}>
   <Text style={{ color: p.text, fontWeight: '800' }}>{user.name}</Text><Text style={{ color: p.muted }}>{user.email}</Text>
   <Text style={{ color: p.muted }}>Role: {user.role}</Text><Text style={{ color: p.primaryText }}>ID: {user.id}</Text>
   {user.clerkId === userId ? <Text style={{ color: p.muted }}>Your account · You cannot change your own role.</Text> : <AdminUserRole key={`${user.id}:${user.role}`} id={user.id} role={user.role} onReload={() => setAttempt(value => value + 1)} />}
  </View>) : <Text style={{ color: p.muted }}>No users returned.</Text>}
  {button(current?.error ? 'Retry users' : 'Refresh users', () => setAttempt(value => value + 1), !current)}
  {current && !current.error ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>{button('Previous', () => setPage(value => value - 1), page <= 1)}<Text style={{ color: p.muted }}>Page {page} of {Math.max(1, current.pages)}</Text>{button('Next', () => setPage(value => value + 1), page >= current.pages)}</View> : null}
 </View>;
}

import { showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { userRoles, updateAdminUserRole, type UserRole } from '../services/users';
export default function AdminUserRole({ id, role, onReload }: { id: string; role: UserRole; onReload: () => void }) {
 const { getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [target, setTarget] = useState<UserRole | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [completed, setCompleted] = useState(false);
 const lock = useRef(false);
 const mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 async function save() {
  if (!target || lock.current || !userRoles.includes(target)) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const token = await getToken();
   if (!mounted.current) return;
   if (!token) throw new Error('Please sign in again.');
   await updateAdminUserRole(id, target, token);
   if (mounted.current) { showToast('User role updated.'); setCompleted(true); onReload(); }
  } catch (cause) {
   if (mounted.current) showToast(cause instanceof Error ? cause.message : 'Unable to save changes.', 'error');
   if (mounted.current) setError(`${cause instanceof Error ? cause.message : 'Unable to update status.'} Refresh this user before trying again.`);
  } finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 const action = (label: string, press: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={press} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 10, marginTop: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800' }}>Change user role</Text>
  {error ? <><Text accessibilityRole="alert" style={{ color: p.terracotta }}>{error}</Text>{action('Refresh users', onReload)}</> : completed ? <Text accessibilityLiveRegion="polite" style={{ color: p.primaryText }}>Role saved. Refreshing users…</Text> : target ? <>
   <Text style={{ color: p.text }}>Change this user from {role} to {target}?</Text>
   {target === 'admin' ? <Text style={{ color: p.terracotta }}>This grants full admin access.</Text> : null}
   <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={{ padding: 12, borderRadius: 10, backgroundColor: p.primary, opacity: busy ? 0.5 : 1 }}><Text style={{ color: p.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : 'Confirm role change'}</Text></Pressable>
   {action('Back', () => setTarget(null), busy)}
  </> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{userRoles.filter(value => value !== role).map(value => <View key={value}>{action(`Set ${value}`, () => setTarget(value))}</View>)}</View>}
 </View>;
}

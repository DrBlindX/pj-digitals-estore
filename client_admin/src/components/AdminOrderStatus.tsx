import { showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { adminOrderTransitions, updateAdminOrderStatus } from '../services/orders';
export default function AdminOrderStatus({ id, status, onReload }: { id: string; status: string; onReload: () => void }) {
 const { getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [expanded, setExpanded] = useState(false);
 const [target, setTarget] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [completed, setCompleted] = useState(false);
 const lock = useRef(false);
 const mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 async function save() {
  if (!target || lock.current || !adminOrderTransitions[status]?.includes(target)) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const token = await getToken();
   if (!mounted.current) return;
   if (!token) throw new Error('Please sign in again.');
   await updateAdminOrderStatus(id, target, token);
   if (mounted.current) { showToast('Order status updated.'); setCompleted(true); onReload(); }
  } catch (cause) {
   if (mounted.current) showToast(cause instanceof Error ? cause.message : 'Unable to save changes.', 'error');
   if (mounted.current) setError(`${cause instanceof Error ? cause.message : 'Unable to update status.'} Refresh this order before trying again.`);
  } finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 const action = (label: string, press: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={press} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 if (!adminOrderTransitions[status]?.length) return <Text style={{ color: p.muted }}>This order has no further status actions.</Text>;
 if (!expanded) return <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} style={{ padding: 12, backgroundColor: p.soft, borderRadius: 10 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>Change status</Text></Pressable>;
 return <View style={{ gap: 10, marginTop: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800' }}>Update order status</Text>
  {error ? <><Text accessibilityRole="alert" style={{ color: p.terracotta }}>{error}</Text>{action('Refresh order', onReload)}</> : completed ? <Text accessibilityLiveRegion="polite" style={{ color: p.primaryText }}>Status saved. Refreshing order…</Text> : target ? <>
   <Text style={{ color: p.text }}>Change this order from {status} to {target}?</Text>
   {target === 'cancelled' ? <Text style={{ color: p.terracotta }}>Cancelling closes this order and triggers the server’s cancellation handling.</Text> : null}
   <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={{ padding: 12, borderRadius: 10, backgroundColor: p.primary, opacity: busy ? 0.5 : 1 }}><Text style={{ color: p.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : 'Confirm status change'}</Text></Pressable>
   {action('Back', () => setTarget(null), busy)}
  </> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{adminOrderTransitions[status].map(value => <View key={value}>{action(`Mark ${value}`, () => setTarget(value))}</View>)}</View>}
 </View>;
}

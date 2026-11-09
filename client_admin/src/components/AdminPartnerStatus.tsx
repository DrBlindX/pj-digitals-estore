import { showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { partnerStatuses, updateAdminPartnerStatus, type PartnerStatus } from '../services/partners';
export default function AdminPartnerStatus({ id, status, onReload }: { id: string; status: PartnerStatus; onReload: () => void }) {
 const { getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [target, setTarget] = useState<PartnerStatus | null>(null);
 const [reason, setReason] = useState('');
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [completed, setCompleted] = useState(false);
 const lock = useRef(false);
 const mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 async function save() {
  if (!target || lock.current || !partnerStatuses.includes(target)) return;
  if (['rejected', 'suspended'].includes(target) && !reason.trim()) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const token = await getToken();
   if (!mounted.current) return;
   if (!token) throw new Error('Please sign in again.');
   await updateAdminPartnerStatus(id, target, reason, token);
   if (mounted.current) { showToast('Delivery partner status updated.'); setCompleted(true); onReload(); }
  } catch (cause) {
   if (mounted.current) showToast(cause instanceof Error ? cause.message : 'Unable to save changes.', 'error');
   if (mounted.current) setError(`${cause instanceof Error ? cause.message : 'Unable to update status.'} Refresh this delivery partner before trying again.`);
  } finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 const action = (label: string, press: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={press} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 10, marginTop: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800' }}>Update delivery partner status</Text>
  {error ? <><Text accessibilityRole="alert" style={{ color: p.terracotta }}>{error}</Text>{action('Refresh delivery partner', onReload)}</> : completed ? <Text accessibilityLiveRegion="polite" style={{ color: p.primaryText }}>Status saved. Refreshing delivery partner…</Text> : target ? <>
   <Text style={{ color: p.text }}>Change this delivery partner from {status} to {target}?</Text>
   <TextInput accessibilityLabel="Reason for delivery partner status change" value={reason} onChangeText={setReason} editable={!busy} multiline placeholder={['rejected', 'suspended'].includes(target) ? 'Reason (required)' : 'Reason (optional)'} placeholderTextColor={p.muted} style={{ color: p.text, backgroundColor: p.background, borderWidth: 1, borderColor: p.border, borderRadius: 10, padding: 12, minHeight: 80 }} />
   <Pressable accessibilityRole="button" disabled={busy || (['rejected', 'suspended'].includes(target) && !reason.trim())} onPress={() => void save()} style={{ padding: 12, borderRadius: 10, backgroundColor: p.primary, opacity: busy ? 0.5 : 1 }}><Text style={{ color: p.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : 'Confirm status change'}</Text></Pressable>
   {action('Back', () => setTarget(null), busy)}
  </> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{partnerStatuses.filter(value => value !== status).map(value => <View key={value}>{action(`Mark ${value}`, () => setTarget(value))}</View>)}</View>}
 </View>;
}

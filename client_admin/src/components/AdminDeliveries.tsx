import { showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readDeliveries, availablePartners, assignAdminDelivery, cancelAdminDelivery, type DeliveryRow } from '../services/deliveries';
import type { AdminPartner } from '../services/partners';
export default function AdminDeliveries() {
 const { userId, getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [unassigned, setUnassigned] = useState(true), [page, setPage] = useState(1), [attempt, setAttempt] = useState(0);
 const key = `${userId}:${unassigned}:${page}:${attempt}`;
 const [state, setState] = useState<{ key: string; rows: DeliveryRow[]; pages: number; error: string } | null>(null);
 const [editing, setEditing] = useState<DeliveryRow | null>(null);
 const [partners, setPartners] = useState<AdminPartner[]>([]);
 const [partnerId, setPartnerId] = useState(''), [reason, setReason] = useState(''), [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const lock = useRef(false), mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 useEffect(() => {
  if (!userId) return;
  const controller = new AbortController();
  void (async () => {
   try { const token = await getToken(); if (controller.signal.aborted) return; if (!token) throw new Error('Please sign in again.'); const result = await readDeliveries(page, unassigned, token, controller.signal); if (!controller.signal.aborted) setState({ key, ...result, error: '' }); }
   catch (cause) { if (!controller.signal.aborted) setState({ key, rows: [], pages: 0, error: cause instanceof Error ? cause.message : 'Unable to load deliveries.' }); }
  })();
  return () => controller.abort();
 }, [userId, getToken, page, unassigned, key]);
 const current = state?.key === key ? state : null;
 async function start(row: DeliveryRow) {
  if (lock.current) return;
  setEditing(row); setPartnerId(''); setReason(''); setError(''); setPartners([]);
  if (!unassigned) return;
  lock.current = true; setBusy(true);
  try { const token = await getToken(); if (!token) throw new Error('Please sign in again.'); const list = await availablePartners(token); if (mounted.current) setPartners(list); }
  catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Unable to load partners.'); }
  finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 async function save() {
  if (!editing || lock.current) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const token = await getToken(); if (!token) throw new Error('Please sign in again.'); if (!mounted.current) return;
   if (unassigned) await assignAdminDelivery(editing.orderId, partnerId, token); else await cancelAdminDelivery(editing.id, reason, token);
   if (mounted.current) { showToast(unassigned ? 'Delivery partner assigned.' : 'Delivery assignment cancelled.'); setEditing(null); }
  } catch (cause) { if (mounted.current) { showToast(cause instanceof Error ? cause.message : 'Delivery update failed.', 'error'); setError(`${cause instanceof Error ? cause.message : 'Delivery update failed.'} Check refreshed records before retrying.`); setEditing(null); } }
  finally { lock.current = false; if (mounted.current) { setBusy(false); setAttempt(value => value + 1); } }
 }
 const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" onPress={action} disabled={busy || disabled} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: busy || disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText }}>{label}</Text></Pressable>;
 return <View style={{ gap: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800', fontSize: 20 }}>Assignments</Text>
  <View style={{ flexDirection: 'row', gap: 8 }}>{[{ label: 'Waiting', value: true }, { label: 'Assigned', value: false }].map(filter => <Pressable key={filter.label} accessibilityRole="button" accessibilityState={{ selected: unassigned === filter.value }} disabled={busy} onPress={() => { if (unassigned !== filter.value) { setUnassigned(filter.value); setPage(1); setEditing(null); setError(''); } }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: unassigned === filter.value ? p.primary : p.soft, opacity: busy ? 0.5 : 1 }}><Text style={{ color: unassigned === filter.value ? p.onPrimary : p.primaryText, fontWeight: '700' }}>{filter.label}</Text></Pressable>)}</View>
  {error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{error}</Text> : null}
  {!current ? <Text style={{ color: p.muted }}>Loading deliveries…</Text> : current.error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{current.error}</Text> : current.rows.length ? current.rows.map(row => <View key={row.id} style={{ backgroundColor: p.surface, padding: 16, borderWidth: 1, borderColor: p.border, borderRadius: 14, gap: 10 }}>
   <Text style={{ color: p.text, fontWeight: '700' }}>{row.number} · ₹{row.total.toLocaleString('en-IN')}</Text><Text style={{ color: p.muted }}>{row.shop} · {row.status}{unassigned ? '' : ` · ${row.driver}`}</Text>
   {editing?.id === row.id ? <>
    <Text style={{ color: p.text }}>{unassigned ? 'Select an available partner and confirm assignment.' : 'Confirm cancellation of this delivery assignment.'}</Text>
    {unassigned ? <>{partners.map(partner => <Pressable key={partner.id} accessibilityRole="radio" accessibilityState={{ checked: partnerId === partner.id }} disabled={busy} onPress={() => setPartnerId(partner.id)} style={{ padding: 12, borderRadius: 8, backgroundColor: partnerId === partner.id ? p.tint : p.soft }}><Text style={{ color: p.text }}>{partnerId === partner.id ? '●' : '○'} {partner.name} · {partner.locations.join(', ')}</Text></Pressable>)}{!busy && !partners.length ? <Text style={{ color: p.muted }}>No approved, online partners available.</Text> : null}</> : <TextInput accessibilityLabel="Delivery cancellation reason" value={reason} onChangeText={setReason} editable={!busy} placeholder="Cancellation reason" placeholderTextColor={p.muted} style={{ color: p.text, padding: 12, borderColor: p.border, borderWidth: 1, borderRadius: 8 }} />}
    <Pressable accessibilityRole="button" disabled={busy || (unassigned ? !partnerId : !reason.trim())} onPress={() => void save()} style={{ padding: 12, borderRadius: 8, backgroundColor: p.primary, opacity: busy || (unassigned ? !partnerId : !reason.trim()) ? 0.5 : 1 }}><Text style={{ color: p.onPrimary }}>{busy ? 'Please wait…' : unassigned ? 'Confirm assignment' : 'Confirm cancellation'}</Text></Pressable>
    {button('Back', () => setEditing(null))}
   </> : unassigned || !['delivered', 'cancelled'].includes(row.status) ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void start(row)} style={{ padding: 12, borderRadius: 8, backgroundColor: p.soft }}><Text style={{ color: p.primaryText }}>{unassigned ? 'Assign partner' : 'Cancel assignment'}</Text></Pressable> : null}
  </View>) : <Text style={{ color: p.muted }}>No records returned.</Text>}
  {button(current?.error ? 'Retry deliveries' : 'Refresh deliveries', () => { setEditing(null); setAttempt(value => value + 1); }, !current)}
  {current && !current.error && current.pages > 1 ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{button('Previous', () => { setEditing(null); setPage(value => value - 1); }, page <= 1)}<Text style={{ color: p.muted }}>Page {page} of {Math.max(1, current.pages)}</Text>{button('Next', () => { setEditing(null); setPage(value => value + 1); }, page >= current.pages)}</View> : null}
 </View>;
}

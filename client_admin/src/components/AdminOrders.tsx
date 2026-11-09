import AdminOrderStatus from './AdminOrderStatus';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readAdminOrders, type AdminOrder } from '../services/orders';
export default function AdminOrders() {
 const { userId, getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [page, setPage] = useState(1);
 const [id, setId] = useState<string | null>(null);
 const [attempt, setAttempt] = useState(0);
 const key = `${userId}:${page}:${id}:${attempt}`;
 const [state, setState] = useState<{ key: string; orders: AdminOrder[]; pages: number; error: string } | null>(null);
 useEffect(() => {
  if (!userId) return;
  const controller = new AbortController();
  void (async () => {
   try {
    const token = await getToken();
    if (controller.signal.aborted) return;
    if (!token) throw new Error('Please sign in again.');
    const data = await readAdminOrders(page, id, token, controller.signal);
    if (!controller.signal.aborted) setState({ key, ...data, error: '' });
   } catch (cause) { if (!controller.signal.aborted) setState({ key, orders: [], pages: 0, error: cause instanceof Error ? cause.message : 'Unable to load orders.' }); }
  })();
  return () => controller.abort();
 }, [userId, getToken, page, id, key]);
 const current = state?.key === key ? state : null;
 const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800', fontSize: 20 }}>{id ? 'Order details' : 'Orders'}</Text>
  <Text style={{ color: p.muted }}>Live orders across all shops.</Text>
  {id ? button('← Back to orders', () => setId(null)) : null}
  {!current ? <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>Loading orders…</Text> : current.error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{current.error}</Text> : current.orders.length ? current.orders.map(order => <View key={order.id} style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 14, padding: 16, gap: 8 }}>
   <Text style={{ color: p.text, fontWeight: '800' }}>{order.number}</Text>
   <Text style={{ color: p.muted }}>{order.customer} · {order.date}</Text>
   <Text style={{ color: p.primaryText }}>₹{order.total.toLocaleString('en-IN')} · {order.status}</Text>
   <Text style={{ color: p.muted }}>{order.payment} · Delivery: {order.deliveryStatus}</Text>
   {id ? <>
    <AdminOrderStatus key={`${order.id}:${order.status}`} id={order.id} status={order.status} onReload={() => setAttempt(value => value + 1)} />
    <Text style={{ color: p.text, fontWeight: '700' }}>Items</Text>
    {order.items.map((item, index) => <View key={index}><Text style={{ color: p.text }}>{item.name}</Text><Text style={{ color: p.muted }}>{item.quantity} × ₹{item.price.toLocaleString('en-IN')}{item.size ? ` · Size ${item.size}` : ''}</Text></View>)}
    <Text style={{ color: p.text, fontWeight: '700' }}>Delivery address</Text><Text style={{ color: p.muted }}>{order.address || 'Address unavailable'}</Text>
    {order.delivery ? <Text style={{ color: p.muted }}>Delivery partner: {order.delivery.driver}</Text> : null}
   </> : button('View details', () => setId(order.id))}
  </View>) : <Text style={{ color: p.muted }}>No orders returned.</Text>}
  {button(current?.error ? 'Retry orders' : 'Refresh orders', () => setAttempt(value => value + 1), !current)}
  {!id && current && !current.error ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>{button('Previous', () => setPage(value => value - 1), page <= 1)}<Text style={{ color: p.muted }}>Page {page} of {Math.max(1, current.pages)}</Text>{button('Next', () => setPage(value => value + 1), page >= current.pages)}</View> : null}
 </View>;
}

import AdminShopStatus from './AdminShopStatus';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readAdminShops, type AdminShop } from '../services/shops';
export default function AdminShops() {
 const { userId, getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [page, setPage] = useState(1);
 const [attempt, setAttempt] = useState(0);
 const key = `${userId}:${page}:${attempt}`;
 const [state, setState] = useState<{ key: string; shops: AdminShop[]; pages: number; error: string } | null>(null);
 useEffect(() => {
  if (!userId) return;
  const controller = new AbortController();
  void (async () => {
   try {
    const token = await getToken();
    if (controller.signal.aborted) return;
    if (!token) throw new Error('Please sign in again.');
    const data = await readAdminShops(page, token, controller.signal);
    if (!controller.signal.aborted) setState({ key, ...data, error: '' });
   } catch (cause) { if (!controller.signal.aborted) setState({ key, shops: [], pages: 0, error: cause instanceof Error ? cause.message : 'Unable to load shops.' }); }
  })();
  return () => controller.abort();
 }, [userId, getToken, page, key]);
 const current = state?.key === key ? state : null;
 const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800', fontSize: 20 }}>Shops</Text>
  <Text style={{ color: p.muted }}>Review shop applications and manage shop status.</Text>
  {!current ? <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>Loading shops…</Text> : current.error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{current.error}</Text> : current.shops.length ? current.shops.map(shop => <View key={shop.id} style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 14, padding: 16, gap: 8 }}>
   <Text style={{ color: p.text, fontWeight: '800' }}>{shop.name}</Text><Text style={{ color: p.muted }}>{shop.owner}{shop.email ? ` · ${shop.email}` : ''}</Text>
   <Text style={{ color: p.muted }}>{shop.location} · {shop.categories.join(', ')}</Text><Text style={{ color: p.primaryText }}>Status: {shop.status}</Text>
   {shop.reason ? <Text style={{ color: p.muted }}>Reason: {shop.reason}</Text> : null}
   <AdminShopStatus key={`${shop.id}:${shop.status}`} id={shop.id} status={shop.status} onReload={() => setAttempt(value => value + 1)} />
  </View>) : <Text style={{ color: p.muted }}>No shops returned.</Text>}
  {button(current?.error ? 'Retry shops' : 'Refresh shops', () => setAttempt(value => value + 1), !current)}
  {current && !current.error ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>{button('Previous', () => setPage(value => value - 1), page <= 1)}<Text style={{ color: p.muted }}>Page {page} of {Math.max(1, current.pages)}</Text>{button('Next', () => setPage(value => value + 1), page >= current.pages)}</View> : null}
 </View>;
}

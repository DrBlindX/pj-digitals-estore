import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/clerkHooks';
import { useAdminTheme } from '../context/AdminTheme';
import { readAdminProducts, type AdminProduct } from '../services/products';
export default function AdminProducts() {
 const { userId, getToken } = useAuth();
 const { palette: p } = useAdminTheme();
 const [page, setPage] = useState(1);
 const [id, setId] = useState<string | null>(null);
 const [attempt, setAttempt] = useState(0);
 const key = `${userId}:${page}:${id}:${attempt}`;
 const [state, setState] = useState<{ key: string; products: AdminProduct[]; pages: number; error: string } | null>(null);
 useEffect(() => {
  if (!userId) return;
  const controller = new AbortController();
  void (async () => {
   try {
    const token = await getToken();
    if (controller.signal.aborted) return;
    if (!token) throw new Error('Please sign in again.');
    const data = await readAdminProducts(page, id, token, controller.signal);
    if (!controller.signal.aborted) setState({ key, ...data, error: '' });
   } catch (cause) { if (!controller.signal.aborted) setState({ key, products: [], pages: 0, error: cause instanceof Error ? cause.message : 'Unable to load products.' }); }
  })();
  return () => controller.abort();
 }, [userId, getToken, page, id, key]);
 const current = state?.key === key ? state : null;
 const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={{ padding: 12, borderRadius: 10, backgroundColor: p.soft, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{label}</Text></Pressable>;
 return <View style={{ gap: 12 }}>
  <Text style={{ color: p.text, fontWeight: '800', fontSize: 20 }}>{id ? 'Product details' : 'Product catalogue'}</Text>
  <Text style={{ color: p.muted }}>Live product listings and stock.</Text>
  {id ? button('← Back to catalogue', () => setId(null)) : null}
  {!current ? <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>Loading products…</Text> : current.error ? <Text accessibilityRole="alert" style={{ color: p.terracotta }}>{current.error}</Text> : current.products.length ? current.products.map(product => <View key={product.id} style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 14, padding: 16, gap: 8 }}>
   {product.images[0] ? <Image source={{ uri: product.images[0] }} resizeMode="contain" accessibilityLabel={product.name} style={{ width: id ? '100%' : 64, height: id ? 200 : 64 }} /> : null}
   <Text style={{ color: p.text, fontWeight: '800' }}>{product.name}</Text><Text style={{ color: p.muted }}>{product.shop} · {product.category}</Text>
   <Text style={{ color: p.primaryText }}>₹{product.price.toLocaleString('en-IN')} · {product.stock} in stock · {product.active ? 'Active' : 'Inactive'}</Text>
   {id ? <><Text style={{ color: p.text }}>{product.description}</Text>{product.images.slice(1, 5).map((uri, index) => <Image key={`${uri}:${index}`} source={{ uri }} resizeMode="contain" style={{ width: '100%', height: 150 }} />)}</> : button('View details', () => setId(product.id))}
  </View>) : <Text style={{ color: p.muted }}>No products returned.</Text>}
  {button(current?.error ? 'Retry products' : 'Refresh products', () => setAttempt(value => value + 1), !current)}
  {!id && current && !current.error ? <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>{button('Previous', () => setPage(value => value - 1), page <= 1)}<Text style={{ color: p.muted }}>Page {page} of {Math.max(1, current.pages)}</Text>{button('Next', () => setPage(value => value + 1), page >= current.pages)}</View> : null}
 </View>;
}

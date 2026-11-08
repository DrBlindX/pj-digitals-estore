import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShop } from '../context/ShopDataContext';
import { useShopUI } from './ShopUI';
import { isLowStock, newlyLowStock } from '../utils/stockAlerts';

export default function LowStockNotice() {
  const { products } = useShop();
  const { C } = useShopUI();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const previous = useRef(new Map<string, number>());
  const [notice, setNotice] = useState<{ ids: string[] } | null>(null);
  useEffect(() => {
    const changed = newlyLowStock(products, previous.current);
    previous.current = new Map(products.map(product => [product.id, product.stock]));
    if (changed.length) setNotice({ ids: changed.map(product => product.id) });
  }, [products]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  const affected = products.filter(product => notice?.ids.includes(product.id) && isLowStock(product));
  if (!affected.length) return null;
  return <View style={{ position: 'absolute', zIndex: 20, top: insets.top + 78, right: 12, left: 12, maxWidth: 440, alignSelf: 'center', borderRadius: 16, padding: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.amber, boxShadow: '0px 5px 20px rgba(35,28,54,0.18)' }}>
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ color: C.text, fontWeight: '800', fontSize: 15 }}>Low stock alert</Text><Text style={{ color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 5 }}>{affected.length === 1 ? `${affected[0].name}: ${affected[0].stock} left.` : `${affected.length} products have fewer than 6 units.`}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss low stock alert" onPress={() => setNotice(null)} style={{ padding: 8 }}><Text style={{ color: C.text, fontSize: 20 }}>×</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={() => { setNotice(null); router.navigate('/inventory'); }} style={{ alignSelf: 'flex-start', paddingVertical: 10 }}><Text style={{ color: C.cyan, fontSize: 12, fontWeight: '800' }}>View stock →</Text></Pressable>
  </View>;
}

import { useShop } from '../context/ShopDataContext';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Page, useShopUI } from '../components/ShopUI';
import { useShopAuth } from '../context/ShopAuthContext';
import { getShopOrder, type ShopOrder } from '../services/shopOrders';

const money = (value: number) => '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function ShopOrdersScreen() {
  const { serverOrders, ordersLoading, ordersError, reloadOrders } = useShop();
  const { account, getToken } = useShopAuth();
  const { C, S } = useShopUI();
  const owner = account?.id;
  const [selected, setSelected] = useState<{ id: string; owner: string } | null>(null);
  const selectedId = selected && selected.owner === owner ? selected.id : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ owner?: string; id: string | null; orders: ShopOrder[]; error: string } | null>(null);
  useEffect(() => {
    if (!owner || !selectedId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again.');
        const orders = [await getShopOrder(selectedId, token, controller.signal)];
        if (!controller.signal.aborted) setResult({ owner, id: selectedId, orders, error: '' });
      } catch (cause) {
        if (!controller.signal.aborted) setResult({ owner, id: selectedId, orders: [], error: cause instanceof Error ? cause.message : 'Unable to load orders.' });
      }
    })();
    return () => controller.abort();
  }, [owner, selectedId, attempt, getToken]);
  const current = selectedId ? result?.owner === owner && result?.id === selectedId ? result : null : ordersLoading ? null : { orders: serverOrders, error: ordersError };
  function reload() { if (!selectedId) { reloadOrders(); return; } setResult(null); setAttempt(value => value + 1); }
  return <Page title={selectedId ? 'Order details' : 'Orders'} subtitle="View-only orders received by your shop." onRefresh={reload} loading={!current}>
    {selectedId ? <Button secondary label="← Back to orders" onPress={() => setSelected(null)} style={{ marginBottom: 14 }} /> : null}
    {!current ? <Text accessibilityLiveRegion="polite" style={S.small}>Loading {selectedId ? 'order details' : 'shop orders'}…</Text> : current.error ? <Card><Text accessibilityRole="alert" style={{ color: C.red, lineHeight: 20 }}>{current.error}</Text><Button label="Retry" onPress={reload} style={{ marginTop: 12 }} /></Card> : <>
      {!current.orders.length ? <Card><Text style={S.name}>No shop orders yet</Text><Text style={S.small}>Orders received by your approved shop will appear here.</Text></Card> : current.orders.map(order => <Card key={order.id} style={{ marginBottom: 14 }}>
        <Text style={S.orderId}>{order.number}</Text><Text style={S.small}>{order.customer} · {order.date}</Text>
        <Text style={[S.price, { marginTop: 12 }]}>{money(order.total)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</Text>
        <Text style={S.small}>Order: {order.status}</Text><Text style={S.small}>Delivery: {order.deliveryStatus}</Text>
        {!selectedId ? <Pressable accessibilityRole="button" accessibilityLabel={`View order ${order.number}`} onPress={() => { if (owner) setSelected({ id: order.id, owner }); }} style={{ paddingVertical: 12 }}><Text style={{ color: C.cyan, fontWeight: '800' }}>View details →</Text></Pressable> : <>
          <Text style={S.small}>Payment: {order.payment}</Text>
          <Text style={S.section}>Items</Text>
          {order.items.map((item, index) => <View key={index} style={S.dividerRow}><Text style={S.name}>{item.name}</Text><Text style={S.small}>{item.quantity} × {money(item.price)}{item.size ? ` · Size ${item.size}` : ''}</Text></View>)}
          <Text style={S.section}>Delivery address</Text><Text style={[S.small, { lineHeight: 20 }]}>{order.address || 'Address unavailable'}</Text>
        </>}
      </Card>)}
      <Button secondary label="Refresh orders" onPress={reload} />
    </>}
  </Page>;
}

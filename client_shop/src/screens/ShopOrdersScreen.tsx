import { useShop } from '../context/ShopDataContext';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Page, useShopUI } from '../components/ShopUI';
import { useShopAuth } from '../context/ShopAuthContext';
import { approveShopOrder, assignShopDelivery, getShopOrder, type ShopOrder } from '../services/shopOrders';

const money = (value: number) => '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function ShopOrdersScreen() {
  const { serverOrders, ordersLoading, ordersError, reloadOrders } = useShop();
  const { account, getToken } = useShopAuth();
  const { C, S } = useShopUI();
  const owner = account?.id;
  const [selected, setSelected] = useState<{ id: string; owner: string } | null>(null);
  const selectedId = selected && selected.owner === owner ? selected.id : null;
  const approvalLock = useRef(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [driverId, setDriverId] = useState('');
  const [assignmentInfo, setAssignmentInfo] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [approvalError, setApprovalError] = useState('');
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
  function reload() { if (approvalLock.current) return; if (!selectedId) { reloadOrders(); return; } setResult(null); setAttempt(value => value + 1); }
  async function approve(order: ShopOrder) {
    if (approvalLock.current || order.status !== 'placed') return;
    approvalLock.current = true;
    setApproving(order.id); setApprovalError(''); setApprovalMessage('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in again.');
      await approveShopOrder(order.id, token);
      setApprovalMessage(`Order ${order.number} approved.`);
    } catch (cause) {
      setApprovalError(`${cause instanceof Error ? cause.message : 'Unable to approve order.'} The latest order status will be reloaded.`);
    } finally {
      setConfirmation(null); setApproving(null); approvalLock.current = false;
      reloadOrders();
      setResult(null); setAttempt(value => value + 1);
    }
  }
  async function assign(order: ShopOrder) {
    if (approvalLock.current || order.status !== 'processing') return;
    const driver = driverId.trim();
    if (!/^[a-f\d]{24}$/i.test(driver)) { setApprovalError('Enter the approved delivery partner’s 24-character ID.'); return; }
    approvalLock.current = true; setApproving(order.id); setApprovalError(''); setApprovalMessage('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in again.');
      await assignShopDelivery(order.id, driver, token);
      setApprovalMessage(`Delivery assigned for order ${order.number}.`);
      setAssignmentInfo(null); setDriverId('');
    } catch (cause) {
      setApprovalError(`${cause instanceof Error ? cause.message : 'Unable to assign delivery.'} Check the refreshed order before retrying.`);
    } finally {
      approvalLock.current = false; setApproving(null); reloadOrders(); setResult(null); setAttempt(value => value + 1);
    }
  }
  return <Page title={selectedId ? 'Order details' : 'Orders'} subtitle="Review and approve new orders received by your shop." onRefresh={reload} loading={!current}>
    {approvalMessage ? <Text accessibilityLiveRegion="polite" style={[S.small, { color: C.green, marginBottom: 12 }]}>{approvalMessage}</Text> : null}
    {approvalError ? <Text accessibilityRole="alert" style={[S.small, { color: C.red, marginBottom: 12 }]}>{approvalError}</Text> : null}
    {selectedId ? <Button disabled={!!approving} secondary label="← Back to orders" onPress={() => setSelected(null)} style={{ marginBottom: 14 }} /> : null}
    {!current ? <Text accessibilityLiveRegion="polite" style={S.small}>Loading {selectedId ? 'order details' : 'shop orders'}…</Text> : current.error ? <Card><Text accessibilityRole="alert" style={{ color: C.red, lineHeight: 20 }}>{current.error}</Text><Button label="Retry" onPress={reload} style={{ marginTop: 12 }} /></Card> : <>
      {!current.orders.length ? <Card><Text style={S.name}>No shop orders yet</Text><Text style={S.small}>Orders received by your approved shop will appear here.</Text></Card> : current.orders.map(order => <Card key={order.id} style={{ marginBottom: 14 }}>
        <Text style={S.orderId}>{order.number}</Text><Text style={S.small}>{order.customer} · {order.date}</Text>
        <Text style={[S.price, { marginTop: 12 }]}>{money(order.total)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</Text>
        <Text style={S.small}>Order: {order.status === 'placed' ? 'Awaiting your approval' : order.status}</Text><Text style={S.small}>Delivery: {order.deliveryStatus}</Text>
        {order.status === 'placed' ? <View style={{ gap: 10, marginTop: 12 }}>
          {confirmation === order.id ? <>
            <Text style={S.small}>Approve this order and start processing it?</Text>
            <Button label={approving === order.id ? 'Approving…' : 'Confirm approval'} disabled={!!approving} onPress={() => void approve(order)} />
            <Button secondary label="Cancel" disabled={!!approving} onPress={() => setConfirmation(null)} />
          </> : <Button label="Approve order" disabled={!!approving} onPress={() => { setConfirmation(order.id); setApprovalMessage(''); setApprovalError(''); }} />}
        </View> : null}
        {order.status === 'processing' && (!order.delivery || ['failed', 'rejected', 'cancelled'].includes(order.delivery.status)) ? <View style={{ gap: 10, marginTop: 12 }}>
          <Button secondary label="Assign to delivery" disabled={!!approving} onPress={() => { setAssignmentInfo(order.id); setDriverId(''); setApprovalError(''); setApprovalMessage(''); }} />
          {assignmentInfo === order.id ? <View style={{ backgroundColor: C.soft, borderRadius: 8, padding: 12, gap: 8 }}>
            <Text style={S.name}>Delivery assignment</Text>
            <Text style={[S.small, { lineHeight: 19 }]}>Enter the delivery partner ID provided by your admin. The partner must be approved and available.</Text>
            <TextInput accessibilityLabel="Delivery partner ID" value={driverId} onChangeText={setDriverId} editable={!approving} autoCapitalize="none" autoCorrect={false} maxLength={24} placeholder="Delivery partner ID" placeholderTextColor={C.muted} style={S.input} />
            <Button label={approving === order.id ? 'Assigning…' : 'Confirm assignment'} disabled={!!approving || !/^[a-f\d]{24}$/i.test(driverId.trim())} onPress={() => void assign(order)} />
            <Button secondary disabled={!!approving} label="Cancel" onPress={() => setAssignmentInfo(null)} />
          </View> : null}
        </View> : null}
        {order.status === 'placed' ? <Text style={[S.small, { marginTop: 10 }]}>Approve this order before arranging delivery.</Text> : order.delivery && !['failed', 'rejected', 'cancelled'].includes(order.delivery.status) ? <Text style={[S.small, { marginTop: 10 }]}>Delivery partner: {order.delivery.driver}</Text> : null}
        {!selectedId ? <Pressable disabled={!!approving} accessibilityRole="button" accessibilityLabel={`View order ${order.number}`} onPress={() => { if (owner) setSelected({ id: order.id, owner }); }} style={{ paddingVertical: 12 }}><Text style={{ color: C.cyan, fontWeight: '800' }}>View details →</Text></Pressable> : <>
          <Text style={S.small}>Payment: {order.payment}</Text>
          <Text style={S.section}>Items</Text>
          {order.items.map((item, index) => <View key={index} style={S.dividerRow}><Text style={S.name}>{item.name}</Text><Text style={S.small}>{item.quantity} × {money(item.price)}{item.size ? ` · Size ${item.size}` : ''}</Text></View>)}
          <Text style={S.section}>Delivery address</Text><Text style={[S.small, { lineHeight: 20 }]}>{order.address || 'Address unavailable'}</Text>
        </>}
      </Card>)}
      <Button disabled={!!approving} secondary label="Refresh orders" onPress={reload} />
    </>}
  </Page>;
}

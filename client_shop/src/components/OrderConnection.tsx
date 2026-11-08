import { Text, View } from 'react-native';
import { useShop } from '../context/ShopDataContext';
import { Button, useShopUI } from './ShopUI';

export default function OrderConnection() {
  const { ordersLoading, ordersError, reloadOrders } = useShop();
  const { C, S } = useShopUI();
  if (!ordersLoading && !ordersError) return null;
  return <View style={[S.card, { marginBottom: 14 }]}>
    <Text accessibilityLiveRegion="polite" style={{ color: ordersError ? C.red : C.muted, lineHeight: 20, fontSize: 12 }}>{ordersError || 'Loading shop orders…'}</Text>
    {ordersError ? <Button secondary label="Retry orders" onPress={reloadOrders} style={{ marginTop: 10 }} /> : null}
  </View>;
}

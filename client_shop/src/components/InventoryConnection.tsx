import { Text, View } from 'react-native';
import { useShop } from '../context/ShopDataContext';
import { Button, useShopUI } from './ShopUI';

export default function InventoryConnection() {
  const { productsLoading, productsError, productsBusy, reloadProducts } = useShop();
  const { C, S } = useShopUI();
  if (!productsLoading && !productsError && !productsBusy) return null;
  return <View style={[S.card, { marginBottom: 14 }]}>
    <Text accessibilityLiveRegion="polite" style={{ color: productsError ? C.red : C.muted, fontSize: 12, lineHeight: 20 }}>{productsError || (productsBusy ? 'Saving product changes…' : 'Loading shop inventory…')}</Text>
    {productsError ? <Button secondary label="Reload inventory" onPress={reloadProducts} style={{ marginTop: 10 }} /> : null}
  </View>;
}

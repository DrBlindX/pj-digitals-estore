import { Text } from 'react-native';
import { Card, Page, useShopUI } from '../components/ShopUI';

export default function AdvertisementsScreen() {
  const { S } = useShopUI();
  return <Page title="Advertisements" subtitle="Shop promotions.">
    <Card><Text style={S.name}>No advertisements to display</Text></Card>
  </Page>;
}

import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Metric, Page, Section, useShopUI } from '../components/ShopUI';
import { useShop } from '../context/ShopDataContext';
import { getShopInsights } from '../utils/shopInsights';

const money = (value: number) => '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function InsightsScreen() {
  const { products, orders, deliveries } = useShop();
  const { C, S } = useShopUI();
  const router = useRouter();
  const insights = getShopInsights(products, orders, deliveries);
  function breakdown(title: string, rows: { label: string; count: number }[], total: number) {
    return <Card style={{ flex: 1, minWidth: 250 }}>
      <Text style={S.section}>{title}</Text>
      {!total ? <Text style={S.small}>No data available yet.</Text> : rows.map(row => <View key={row.label} style={{ marginBottom: 16 }}>
        <View style={S.spread}><Text style={S.small}>{row.label}</Text><Text style={S.name}>{row.count} · {Math.round(row.count / total * 100)}%</Text></View>
        <View style={{ height: 7, backgroundColor: C.soft, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}><View style={{ height: 7, width: `${row.count / total * 100}%`, backgroundColor: C.cyan, borderRadius: 4 }} /></View>
      </View>)}
    </Card>;
  }
  return <Page title="Insights" subtitle="A clear view of your shop’s orders and inventory.">
    <Card style={{ backgroundColor: C.soft, marginBottom: 16 }}><Text style={S.name}>Preview insights · Current session</Text><Text style={[S.small, { lineHeight: 18 }]}>Calculated from the data currently in this app. These are sample orders and local stock changes, not live sales or confirmed payments.</Text></Card>
    <View style={S.metrics}>
      <Metric label="Order value" value={money(insights.orderValue)} foot={`${orders.length} orders in this preview`} />
      <Metric label="Average order" value={money(insights.averageOrder)} foot="Order value divided by orders" />
      <Metric label="Inventory value" value={money(insights.inventoryValue)} foot="Listed price × units on hand" />
      <Metric label="Low-stock products" value={String(insights.lowStock.length)} foot="Below 6 units, including sold out" />
    </View>
    <Section>At a glance</Section>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {breakdown('Order status', insights.orders, orders.length)}
      {breakdown('Stock health', insights.inventory, products.length)}
    </View>
    <Section>Order and delivery summary</Section>
    <Card>
      {[['Completed order value', money(insights.completedValue)], ['Order completion', `${insights.completionRate}%`], ['Active deliveries', String(insights.activeDeliveries)], ['Delivered', String(insights.delivered)], ['Products listed', String(products.length)], ['Units in stock', String(insights.units)]].map(([label, value]) => <View key={label} style={[S.spread, S.dividerRow, { gap: 12 }]}><Text style={S.small}>{label}</Text><Text style={S.name}>{value}</Text></View>)}
    </Card>
    <Section>Needs your attention</Section>
    <Card>{insights.lowStock.length ? <>
      {insights.lowStock.slice(0, 5).map(product => <View key={product.id} style={[S.spread, S.dividerRow, { gap: 12 }]}><Text style={[S.name, { flex: 1 }]}>{product.name}</Text><Text style={{ color: C.red, fontSize: 12, fontWeight: '800' }}>{product.stock === 0 ? 'Out of stock' : `${product.stock} left`}</Text></View>)}
      <Button secondary label="Manage stock →" onPress={() => router.navigate('/inventory')} style={{ marginTop: 12 }} />
    </> : <Text style={S.small}>All listed products have at least 6 units available.</Text>}</Card>
  </Page>;
}

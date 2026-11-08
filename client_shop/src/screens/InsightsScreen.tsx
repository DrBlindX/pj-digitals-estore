import { useShopReport } from '../hooks/useShopReport';
import { parseShopStats, parseSettlements } from '../services/shopReports';
import OrderConnection from '../components/OrderConnection';
import InventoryConnection from '../components/InventoryConnection';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Metric, Page, Section, useShopUI } from '../components/ShopUI';
import { useShop } from '../context/ShopDataContext';
import { getShopInsights } from '../utils/shopInsights';

const money = (value: number) => '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function InsightsScreen() {
  const { products, orders, deliveries, productsLoading, productsError, reloadProducts, ordersLoading, ordersError, reloadOrders } = useShop();
  const stats = useShopReport('/api/shop/stats?days=30', parseShopStats);
  const settlements = useShopReport('/api/shop/settlements', parseSettlements);
  const { C, S } = useShopUI();
  const router = useRouter();
  const ordersUnavailable = ordersLoading || !!ordersError;
  const stockUnavailable = productsLoading || !!productsError;
  const insights = getShopInsights(products, orders, deliveries);
  function breakdown(title: string, rows: { label: string; count: number }[], total: number, unavailable: boolean) {
    return <Card style={{ flex: 1, minWidth: 250 }}>
      <Text style={S.section}>{title}</Text>
      {unavailable ? <Text style={S.small}>Waiting for server data. Check any loading or error message above.</Text> : !total ? <Text style={S.small}>No records returned.</Text> : rows.map(row => <View key={row.label} style={{ marginBottom: 16 }}>
        <View style={S.spread}><Text style={S.small}>{row.label}</Text><Text style={S.name}>{row.count} · {Math.round(row.count / total * 100)}%</Text></View>
        <View style={{ height: 7, backgroundColor: C.soft, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}><View style={{ height: 7, width: `${row.count / total * 100}%`, backgroundColor: C.cyan, borderRadius: 4 }} /></View>
      </View>)}
    </Card>;
  }
  return <Page title="Insights" subtitle="A clear view of your shop’s orders and inventory." onRefresh={() => { reloadProducts(); reloadOrders(); stats.reload(); settlements.reload(); }} loading={productsLoading || ordersLoading || stats.loading || settlements.loading}>
    <InventoryConnection /><OrderConnection />
    <Card style={{ backgroundColor: C.soft, marginBottom: 16 }}><Text style={S.name}>Your shop insights</Text><Text style={[S.small, { lineHeight: 18 }]}>Orders, delivery records and inventory come from your shop on the server. Order value excludes cancelled orders and is not a payment or payout total.</Text></Card>
    <View style={S.metrics}>
      <Metric label="Order value" value={ordersUnavailable ? "—" : money(insights.orderValue)} foot={`${orders.length} saved shop orders`} />
      <Metric label="Average order" value={ordersUnavailable ? "—" : money(insights.averageOrder)} foot="Average excluding cancelled orders" />
      <Metric label="Inventory value" value={stockUnavailable ? "—" : money(insights.inventoryValue)} foot="Listed price × units on hand" />
      <Metric label="Low-stock products" value={stockUnavailable ? "—" : String(insights.lowStock.length)} foot="Below 6 units, including sold out" />
    </View>
    <Section>Server statistics · last 30 days</Section>
    {stats.error ? <Card><Text accessibilityRole="alert" style={S.small}>{stats.error}</Text><Button label="Retry statistics" onPress={stats.reload} /></Card> : stats.loading ? <Text style={S.small}>Loading statistics…</Text> : stats.data ? <View style={S.metrics}>
      <Metric label="Orders" value={String(stats.data.orders)} foot="Excluding cancelled orders" />
      <Metric label="Product sales" value={money(stats.data.sales)} foot="Product subtotals, excluding cancelled" />
      <Metric label="Paid product sales" value={money(stats.data.paidSales)} foot="Confirmed paid orders" />
      <Metric label="Catalogue products" value={String(stats.data.productCount)} foot="All products in your shop" />
    </View> : null}
    <Section>Settlements</Section>
    <Card>{settlements.loading ? <Text style={S.small}>Loading settlements…</Text> : settlements.error ? <><Text accessibilityRole="alert" style={S.small}>{settlements.error}</Text><Button label="Retry settlements" onPress={settlements.reload} /></> : settlements.data?.length ? settlements.data.map(row => <View key={row.id} style={S.dividerRow}>
      <Text style={S.name}>{money(row.netPayable)} · {row.status}</Text>
      <Text style={S.small}>Gross sales: {money(row.grossSales)} · Commission: {money(row.commission)}</Text>
      {row.periodFrom && row.periodTo ? <Text style={S.small}>{row.periodFrom.slice(0, 10)} – {row.periodTo.slice(0, 10)}</Text> : null}
      {row.reference ? <Text style={S.small}>Reference: {row.reference}</Text> : null}
    </View>) : <Text style={S.small}>No settlements returned for your shop.</Text>}</Card>
    <Section>At a glance</Section>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {breakdown('Order status', insights.orders, orders.length, ordersUnavailable)}
      {breakdown('Stock health', insights.inventory, products.length, stockUnavailable)}
    </View>
    <Section>Order and delivery summary</Section>
    <Card>
      {[['Delivered order value', ordersUnavailable ? '—' : money(insights.completedValue)], ['Order completion', ordersUnavailable ? '—' : `${insights.completionRate}%`], ['Active deliveries', ordersUnavailable ? '—' : String(insights.activeDeliveries)], ['Delivered', ordersUnavailable ? '—' : String(insights.delivered)], ['Products listed', stockUnavailable ? '—' : String(products.length)], ['Units in stock', stockUnavailable ? '—' : String(insights.units)]].map(([label, value]) => <View key={label} style={[S.spread, S.dividerRow, { gap: 12 }]}><Text style={S.small}>{label}</Text><Text style={S.name}>{value}</Text></View>)}
    </Card>
    <Section>Needs your attention</Section>
    <Card>{stockUnavailable ? <Text style={S.small}>Inventory data unavailable.</Text> : insights.lowStock.length ? <>
      {insights.lowStock.slice(0, 5).map(product => <View key={product.id} style={[S.spread, S.dividerRow, { gap: 12 }]}><Text style={[S.name, { flex: 1 }]}>{product.name}</Text><Text style={{ color: C.red, fontSize: 12, fontWeight: '800' }}>{product.stock === 0 ? 'Out of stock' : `${product.stock} left`}</Text></View>)}
      <Button secondary label="Manage stock →" onPress={() => router.navigate('/inventory')} style={{ marginTop: 12 }} />
    </> : <Text style={S.small}>{products.length ? 'All listed products have at least 6 units available.' : 'No products returned for this shop.'}</Text>}</Card>
  </Page>;
}

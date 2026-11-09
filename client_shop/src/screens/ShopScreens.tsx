import OrderConnection from '../components/OrderConnection';
import { isActiveOrder, isActiveDelivery } from '../utils/orderSummary';
import { getShopInsights } from '../utils/shopInsights';
import ProductImages from '../components/ProductImages';
import InventoryConnection from '../components/InventoryConnection';
import type { ProductImage } from '../services/shopProducts';
import { useShopAuth } from '../context/ShopAuthContext';
import { isLowStock } from '../utils/stockAlerts';
import { useLocalGreeting } from '../hooks/useLocalGreeting';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Button, Card, Metric, Page, Section, useShopUI } from '../components/ShopUI';
import { useShop } from '../context/ShopDataContext';
import type { Delivery, Order, Product, ProductUpdate } from '../context/ShopDataContext';

const cash = (n: number): string => '₹' + Math.round(Number(n)).toLocaleString('en-IN');
function deliveryLabel(status?: Delivery['status']) { return status ?? 'Not assigned'; }
function OrderRow({ order }: { order: Order }) { const { S } = useShopUI();
 const { deliveries } = useShop();
 const status = deliveryLabel(deliveries.find(delivery => delivery.orderId === order.id)?.status);
 return <View style={S.dividerRow}><View style={S.row}><View style={{ flex: 1 }}><Text style={S.orderId}>{order.number} · {order.customer}</Text><Text style={S.small}>{order.items} item{order.items === 1 ? '' : 's'} · {order.time}</Text>{order.status === 'Placed' ? <Text style={[S.small, { fontWeight: '700' }]}>Awaiting your approval · Open Orders to approve</Text> : null}</View><View style={{ alignItems: 'flex-end' }}><Text style={S.price}>{cash(order.total)}</Text><View style={{ marginTop: 6 }}><Badge value={status} /></View></View></View></View>;
}
function ProductRow({ product }: { product: Product }) { const { S } = useShopUI();
 const symbol = product.category === 'Textiles' ? '▱' : product.category === 'Computer Items' ? '⌘' : product.category === 'Home Appliances' ? '⌂' : '◇';
 return <View style={S.productRow}><View style={S.glyph}>{product.images?.[0] ? <Image source={{ uri: product.images[0] }} style={{ width: 36, height: 36, borderRadius: 7 }} /> : <Text style={S.glyphText}>{symbol}</Text>}</View><View style={{ flex: 1 }}><Text style={S.name}>{product.name}</Text><Text style={S.small}>Ref {product.sku} · {product.category}</Text>{product.description ? <Text numberOfLines={2} style={S.small}>{product.description}</Text> : null}</View><View style={{ alignItems: 'flex-end' }}><Text style={S.price}>{cash(product.price)}</Text><Text style={S.small}>{product.stock} in stock</Text>{product.price < 500 ? <Text style={S.small}>Min. 3 per order</Text> : null}</View></View>;
}
function Filter({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) { const { S } = useShopUI(); return <View style={S.chips}>{items.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[S.chip, item === value && S.chipOn]}><Text style={[S.chipText, item === value && S.chipTextOn]}>{item}</Text></Pressable>)}</View>; }
function ProductModal({ visible, close }: { visible: boolean; close: () => void }) { const { C, S } = useShopUI();
 const { addProduct, shopCategory, productsBusy, productsLoading, productsError } = useShop();
 const [newImages, setNewImages] = useState<ProductImage[]>([]); const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [price, setPrice] = useState(''); const [stock, setStock] = useState('');
 const save = async () => {
  if (!description.trim()) return Alert.alert('Add product', 'Enter a product description.');
  if (!newImages.length || newImages.length > 5) return Alert.alert('Add product', 'Select between 1 and 5 product images.');
  if (!name.trim() || !price || !Number.isFinite(Number(price)) || Number(price) < 0) return Alert.alert('Add product', 'Enter a product name and valid price.');
  if (!Number.isSafeInteger(Number(stock || 0)) || Number(stock || 0) < 0) return Alert.alert('Add product', 'Stock must be a whole number of zero or more.');
  try { await addProduct({ name: name.trim(), description: description.trim(), price: Number(price), stock: Number(stock || 0), newImages }); }
  catch (cause) { return Alert.alert('Add product', cause instanceof Error ? cause.message : 'Unable to add product.'); }
  setName(''); setDescription(''); setPrice(''); setStock(''); setNewImages([]); close();
 };
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!productsBusy) close(); }}><View style={S.modalShade}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled"><View style={S.modal}><View style={[S.row, { justifyContent: 'space-between' }]}><Text style={S.orderId}>Add a product</Text><Pressable disabled={productsBusy} onPress={close}><Text style={{ color: C.muted, fontSize: 22 }}>×</Text></Pressable></View>
  <Text style={S.label}>PRODUCT NAME</Text><TextInput editable={!productsBusy} value={name} onChangeText={setName} placeholder="e.g. Bluetooth speaker" placeholderTextColor={C.muted} style={S.input} />
  <Text style={S.label}>DESCRIPTION</Text><TextInput editable={!productsBusy} accessibilityLabel="Product description" value={description} onChangeText={setDescription} multiline maxLength={1000} placeholder="Describe the product, features and specifications" placeholderTextColor={C.muted} textAlignVertical="top" style={[S.input, { minHeight: 100 }]} />
  <View style={S.row}><View style={{ flex: 1, marginRight: 7 }}><Text style={S.label}>PRICE (₹)</Text><TextInput editable={!productsBusy} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="2,499" placeholderTextColor={C.muted} style={S.input} /></View><View style={{ flex: 1, marginLeft: 7 }}><Text style={S.label}>STARTING STOCK</Text><TextInput editable={!productsBusy} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.muted} style={S.input} /></View></View>
    <Text style={S.small}>Products below ₹500 require a minimum of 3 units per customer order. ₹500 and above allow 1 unit.</Text>
  <Text style={[S.small, { marginBottom: 12 }]}>{shopCategory ? `Products are automatically listed under ${shopCategory}.` : 'Shop category unavailable. Contact the admin.'}</Text>
  <ProductImages kept={[]} added={newImages} onChange={(_, images) => setNewImages(images)} disabled={productsBusy} />
  <Button disabled={productsBusy || productsLoading || !!productsError || !shopCategory} label={productsBusy ? 'Saving…' : 'Save product'} onPress={() => void save()} /><Text style={[S.small, { marginTop: 9 }]}>Saved to your approved shop after server confirmation.</Text></View></ScrollView></View></Modal>;
}
function TeamModal({ visible, close }: { visible: boolean; close: () => void }) { const { C, S } = useShopUI();
 const { addMember } = useShop(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('Order staff');
 const save = () => { if (!name.trim() || !email.trim()) return Alert.alert('Invite staff', 'Enter a name and email.'); addMember({ name: name.trim(), email: email.trim(), role }); setName(''); setEmail(''); close(); };
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><View style={S.modalShade}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled"><View style={S.modal}><View style={[S.row, { justifyContent: 'space-between' }]}><Text style={S.orderId}>Add a team member</Text><Pressable onPress={close}><Text style={{ color: C.muted, fontSize: 22 }}>×</Text></Pressable></View>
 <Text style={S.label}>FULL NAME</Text><TextInput value={name} onChangeText={setName} placeholder="Team member name" placeholderTextColor={C.muted} style={S.input} />
 <Text style={S.label}>EMAIL</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@example.com" placeholderTextColor={C.muted} style={S.input} />
 <Text style={S.label}>ROLE</Text><Filter items={['Store manager', 'Order staff', 'Inventory staff']} value={role} onChange={setRole} />
 <Button label="Add to team" onPress={save} /><Text style={[S.small, { marginTop: 9 }]}>Demo only. An invitation will not be sent yet.</Text></View></ScrollView></View></Modal>;
}

export function Home() { const { C, S } = useShopUI();
 const greeting = useLocalGreeting();
 const { account } = useShopAuth();
 const { orders, deliveries, products, productsLoading, productsError, reloadProducts, ordersLoading, ordersError, reloadOrders } = useShop();
 const router = useRouter();
 const [addingProduct, setAddingProduct] = useState(false);
 const orderValue = getShopInsights(products, orders, deliveries).orderValue;
 const ordersUnavailable = ordersLoading || !!ordersError;
 const openOrders = orders.filter(isActiveOrder); const low = products.filter(isLowStock);
 return <Page title={account?.profileName ? `${greeting}, ${account.profileName}` : greeting} subtitle="Here is what is happening at your shop today." onRefresh={() => { reloadProducts(); reloadOrders(); }} loading={productsLoading || ordersLoading}><InventoryConnection /><OrderConnection />
  <LinearGradient colors={C.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.banner}><Text style={S.eyebrow}>YOUR STORE AT A GLANCE</Text><Text style={S.bannerTitle}>Your shop, all in one place.</Text><Text style={S.bannerCopy}>View orders, keep products in stock, and help customers find what they need.</Text></LinearGradient>
  <View style={S.metrics}><Metric label="Order value" value={ordersUnavailable ? "—" : cash(orderValue)} foot="Saved orders, excluding cancelled" /><Metric label="Active orders" value={ordersUnavailable ? "—" : String(openOrders.length).padStart(2, '0')} foot="Orders needing attention" /><Metric label="Products listed" value={productsLoading || productsError ? "—" : String(products.length).padStart(2, '0')} foot="In your catalogue" /></View>
  <Section>Quick actions</Section>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
    <Pressable accessibilityRole="button" onPress={() => setAddingProduct(true)} style={[S.card, { flex: 1, minWidth: 140, padding: 18, gap: 9 }]}>
      <MaterialCommunityIcons name="plus-box-outline" size={28} color={C.green} />
      <Text style={S.name}>Add Product</Text><Text style={[S.small, { lineHeight: 18 }]}>List a new item in your shop</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/inventory')} style={[S.card, { flex: 1, minWidth: 140, padding: 18, gap: 9 }]}>
      <MaterialCommunityIcons name="package-variant-closed" size={28} color={C.amber} />
      <Text style={S.name}>Update Stock</Text><Text style={[S.small, { lineHeight: 18 }]}>Adjust quantities and manage stock</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/insights')} style={[S.card, { flex: 1, minWidth: 140, padding: 18, gap: 9 }]}>
      <MaterialCommunityIcons name="chart-box-outline" size={28} color={C.cyan} />
      <Text style={S.name}>View Insights</Text><Text style={[S.small, { lineHeight: 18 }]}>Orders, stock and inventory value</Text>
    </Pressable>
  </View>
  <ProductModal visible={addingProduct} close={() => setAddingProduct(false)} />
  <Section>Active orders</Section><Card>{ordersUnavailable ? <Text style={S.small}>{ordersLoading ? 'Loading orders…' : 'Order data unavailable. Retry to load your shop orders.'}</Text> : openOrders.length ? openOrders.slice(0, 3).map((order) => <OrderRow key={order.id} order={order} />) : <Text style={S.small}>No active orders returned for your shop.</Text>}<Button secondary label="View all orders →" onPress={() => router.navigate('/orders')} style={{ marginTop: 12 }} /></Card>
  <Section>Low stock · {low.length} items</Section><Card>{low.length ? low.map((product) => <ProductRow key={product.id} product={product} />) : <Text style={S.small}>{productsLoading ? 'Loading stock…' : productsError ? 'Inventory unavailable. Reload to check stock.' : 'Everything is well stocked.'}</Text>}</Card>
  <Text style={[S.small, { textAlign: 'center', marginTop: 18 }]}>Orders and inventory are loaded from your shop on the server.</Text>
 </Page>;
}
function DeliveryCard({ delivery }: { delivery: Delivery }) { const { C, S } = useShopUI();
 const steps = ['Pickup', 'Delivery'];
 const current: Record<Delivery['status'], number> = { 'Awaiting pickup': -1, 'Picked up': 0, 'Out for delivery': 0, Delivered: 1, Failed: -1, Rejected: -1, Cancelled: -1, 'Status unavailable': -1 };
 const currentStep = current[delivery.status];
 return <Card style={{ marginBottom: 12 }}>
  <View style={[S.row, { justifyContent: 'space-between', gap: 12 }]}><View style={{ flex: 1 }}><Text style={S.orderId}>{delivery.id} · Order {delivery.orderNumber}</Text><Text style={S.small}>{delivery.customer} · {delivery.items} item{delivery.items === 1 ? '' : 's'}</Text></View><Badge value={deliveryLabel(delivery.status)} /></View>
  <View style={[S.productRow, { marginTop: 9 }]}><View style={{ flex: 1 }}><Text style={S.small}>DELIVERY ADDRESS</Text><Text style={[S.name, { marginTop: 4 }]}>{delivery.address}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={S.small}>ORDER TOTAL</Text><Text style={[S.price, { marginTop: 4 }]}>{cash(delivery.total)}</Text></View></View>
  <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 10 }]}><Text style={S.small}>Driver: {delivery.driver}</Text><Text style={S.small}>{delivery.window}</Text></View>
  <View style={[S.row, { justifyContent: 'space-between', marginTop: 4, marginBottom: 2 }]}>{steps.map((step, index) => <View key={step} style={{ flex: 1, alignItems: index === 0 ? 'flex-start' : index === steps.length - 1 ? 'flex-end' : 'center' }}><Text style={{ color: index <= currentStep ? C.green : C.muted, fontSize: 9, fontWeight: '700' }}>{index <= currentStep ? '●' : '○'} {step}</Text></View>)}</View>
 </Card>;
}

export function Deliveries() { const { S } = useShopUI();
 const { deliveries, ordersLoading, ordersError, reloadOrders } = useShop();
 const unavailable = ordersLoading || !!ordersError;
 const [filter, setFilter] = useState('All');
 const shown = deliveries.filter((d) => filter === 'All' || (filter === 'Delivered' ? d.status === 'Delivered' : isActiveDelivery(d)));
 return <Page title="Deliveries" subtitle="View delivery details returned with your shop orders." onRefresh={reloadOrders} loading={ordersLoading}><OrderConnection />
  <View style={S.metrics}><Metric label="In progress" value={unavailable ? "—" : String(deliveries.filter(isActiveDelivery).length)} foot="Deliveries being tracked" /><Metric label="Delivered" value={unavailable ? "—" : String(deliveries.filter((d) => d.status === 'Delivered').length)} foot="Completed drop-offs" /></View>
  <Section>Delivery orders</Section>
  <Filter items={['All', 'In progress', 'Delivered']} value={filter} onChange={setFilter} />
  {!unavailable && shown.length ? shown.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} />) : <Card><Text style={S.small}>{unavailable ? 'Delivery data unavailable while shop orders are loading or have an error.' : 'No delivery records returned for this group.'}</Text></Card>}
  <Text style={[S.small, { marginTop: 6 }]}>View only · Statuses are supplied by the server.</Text>
 </Page>;
}
export function Products() { const { C, S } = useShopUI();
 const { products, productsLoading, productsError, reloadProducts } = useShop(); const [query, setQuery] = useState(''); const [show, setShow] = useState(false);
 const list = useMemo(() => products.filter((p) => (p.name + p.sku + p.category).toLowerCase().includes(query.toLowerCase())), [products, query]);
 return <Page title="Products" subtitle="Add items to your store and keep their details up to date." onRefresh={reloadProducts} loading={productsLoading}><InventoryConnection /><View style={[S.row, { marginBottom: 13 }]}><TextInput value={query} onChangeText={setQuery} placeholder="Search products or reference" placeholderTextColor={C.muted} style={[S.input, { flex: 1, marginBottom: 0, marginRight: 8 }]} /><Button label="＋ Add" onPress={() => setShow(true)} /></View><Card>{list.length ? list.map((p) => <ProductRow key={p.id} product={p} />) : <Text style={S.small}>{productsLoading ? 'Loading products…' : productsError ? 'Inventory unavailable.' : 'No products match your search.'}</Text>}</Card><ProductModal visible={show} close={() => setShow(false)} /></Page>;
}
type StockFields = { description: string; name: string; price: string; stock: string };
function EditStockModal({ product, visible, close, saveProduct }: { product: Product | null; visible: boolean; close: () => void; saveProduct: (id: string, details: ProductUpdate) => Promise<void> }) { const { C, S } = useShopUI();
 const { productsBusy } = useShop();
 const [keptImages, setKeptImages] = useState(product?.images ?? []);
 const [newImages, setNewImages] = useState<ProductImage[]>([]);
 const [fields, setFields] = useState(() => product ? { name: product.name, description: product.description ?? '', price: String(product.price), stock: String(product.stock) } : { name: '', description: '', price: '', stock: '' });
 const [error, setError] = useState('');
 const change = (key: keyof StockFields, value: string) => setFields((current) => ({ ...current, [key]: value }));
 const submit = async () => {
  if (!product) return;
  if (keptImages.length + newImages.length < 1 || keptImages.length + newImages.length > 5) return setError('Keep between 1 and 5 product images.');
  const price = Number(fields.price);
  const stock = Number(fields.stock);
  if (!fields.name.trim() || !fields.description.trim()) return setError('Enter a product name and description.');
  if (!fields.price.trim() || !Number.isFinite(price) || price < 0) return setError('Enter a valid price in rupees.');
  if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a whole number of zero or more.');
  try { await saveProduct(product.id, { name: fields.name.trim(), description: fields.description.trim(), price, stock, images: keptImages, newImages }); }
  catch (cause) { return setError(cause instanceof Error ? cause.message : 'Unable to save product.'); }
  close();
 };
 if (!product) return null;
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!productsBusy) close(); }}>
  <View style={S.modalShade}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
   <View style={S.modal}>
    <View style={[S.row, { justifyContent: 'space-between', marginBottom: 9 }]}><Text style={S.orderId}>Edit stock item</Text><Pressable disabled={productsBusy} onPress={close}><Text style={{ color: C.muted, fontSize: 22 }}>×</Text></Pressable></View>
    <Text style={S.label}>PRODUCT NAME</Text><TextInput editable={!productsBusy} value={fields.name} onChangeText={(value) => change('name', value)} style={S.input} />
    <Text style={S.label}>DESCRIPTION</Text><TextInput editable={!productsBusy} accessibilityLabel="Edit product description" value={fields.description} onChangeText={(value) => change('description', value)} multiline maxLength={1000} placeholder="Describe the product, features and specifications" placeholderTextColor={C.muted} textAlignVertical="top" style={[S.input, { minHeight: 100 }]} />
    <Text style={S.small}>Product reference: {product.sku}</Text>
    <Text style={[S.small, { marginBottom: 12 }]}>Shop category: {product.category}</Text>
    <View style={S.row}><View style={{ flex: 1, marginRight: 7 }}><Text style={S.label}>PRICE (₹)</Text><TextInput editable={!productsBusy} value={fields.price} onChangeText={(value) => change('price', value)} keyboardType="decimal-pad" style={S.input} /></View><View style={{ flex: 1, marginLeft: 7 }}><Text style={S.label}>QUANTITY</Text><TextInput editable={!productsBusy} value={fields.stock} onChangeText={(value) => change('stock', value)} keyboardType="number-pad" style={S.input} /></View></View>
    <Text style={S.small}>Products below ₹500 require a minimum of 3 units per customer order. ₹500 and above allow 1 unit.</Text>
    <ProductImages kept={keptImages} added={newImages} disabled={productsBusy} onChange={(kept, added) => { setKeptImages(kept); setNewImages(added); }} /><Text style={[S.small, { marginBottom: 12 }]}>Low-stock alerts start below 6 units.</Text>
    {error ? <Text style={{ color: C.red, fontSize: 12, marginBottom: 11 }}>{error}</Text> : null}
    <View style={S.row}><Button disabled={productsBusy} label="Cancel" secondary onPress={close} style={{ flex: 1, marginRight: 6 }} /><Button disabled={productsBusy} label={productsBusy ? "Saving…" : "Save changes"} onPress={() => void submit()} style={{ flex: 1, marginLeft: 6 }} /></View>
   </View>
  </ScrollView></View>
 </Modal>;
}

function DeleteStockModal({ product, visible, cancel, confirm }: { product: Product | null; visible: boolean; cancel: () => void; confirm: () => void }) { const { S } = useShopUI();
 const { productsBusy } = useShop();
 if (!product) return null;
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!productsBusy) cancel(); }}>
  <View style={S.modalShade}><View style={S.modal}>
   <Text style={S.orderId}>Delete product?</Text>
   <Text style={[S.small, { lineHeight: 19, marginTop: 9, marginBottom: 18 }]}>“{product.name}” will be removed from this store&apos;s inventory. You can add it again later.</Text>
   <View style={S.row}><Button disabled={productsBusy} label="Keep product" secondary onPress={cancel} style={{ flex: 1, marginRight: 6 }} /><Button disabled={productsBusy} label={productsBusy ? "Deleting…" : "Delete product"} onPress={confirm} style={{ flex: 1, marginLeft: 6, backgroundColor: '#AF3D52' }} /></View>
  </View></View>
 </Modal>;
}
export function Inventory() { const { C, S } = useShopUI();
 const { products, changeStock, updateProduct, deleteProduct, productsBusy, refreshProduct, productsLoading, productsError, reloadProducts } = useShop();
 const report = (cause: unknown) => Alert.alert('Inventory', cause instanceof Error ? cause.message : 'Inventory request failed.');
 const [filter, setFilter] = useState('All stock');
 const [editingProduct, setEditingProduct] = useState<Product | null>(null);
 const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
 const stockStatus = (product: Product): string => product.stock === 0 ? 'Out of stock' : isLowStock(product) ? 'Low stock' : 'In stock';
 const counts = {
  all: products.length,
  low: products.filter(isLowStock).length,
  out: products.filter((p) => stockStatus(p) === 'Out of stock').length,
 };
 const list = products.filter((p) => filter === 'All stock' || (filter === 'Low stock' ? isLowStock(p) : stockStatus(p) === filter));
 return <Page title="Stock status" subtitle="See stock levels, product details, and what needs reordering." onRefresh={reloadProducts} loading={productsLoading}><InventoryConnection />
  <View style={S.metrics}><Metric label="Products tracked" value={String(counts.all)} foot="In this store" /><Metric label="Low stock" value={String(counts.low)} foot="Fewer than 6 units, including sold out" /><Metric label="Out of stock" value={String(counts.out)} foot="Unavailable to customers" /></View>
  <Section>Inventory details</Section>
  <Filter items={['All stock', 'In stock', 'Low stock', 'Out of stock']} value={filter} onChange={setFilter} />
  <Card>{list.length ? list.map((p, index) => <View key={p.id} style={[S.dividerRow, index === list.length - 1 && { borderBottomWidth: 0 }]}>
   <View style={[S.row, { alignItems: 'flex-start' }]}>
    <View style={{ flex: 1, paddingRight: 8 }}>
     <Text style={S.name}>{p.name}</Text>
     <Text style={S.small}>Ref {p.sku} · {p.category}</Text>{p.description ? <Text numberOfLines={2} style={S.small}>{p.description}</Text> : null}
     <Text style={[S.small, { marginTop: 6 }]}>{p.location} · Low stock below 6</Text>
     <Text style={[S.small, { color: C.text, marginTop: 5 }]}>{cash(p.price)} each</Text>
     <View style={{ marginTop: 7 }}><Badge value={stockStatus(p)} /></View>
    </View>
    <View style={{ alignItems: 'center' }}>
     <Text style={S.small}>On hand</Text>
     <View style={[S.row, { marginTop: 7 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Decrease stock for ' + p.name} disabled={productsBusy || p.stock === 0} onPress={() => { void changeStock(p.id, -1).catch(report); }} style={S.adjust}><Text style={S.orderId}>−</Text></Pressable>
      <Text style={S.stockNum}>{p.stock}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={'Increase stock for ' + p.name} disabled={productsBusy} onPress={() => { void changeStock(p.id, 1).catch(report); }} style={S.adjust}><Text style={S.orderId}>＋</Text></Pressable>
     </View>
    </View>
   </View>
   <View style={[S.row, { marginTop: 12 }]}>
    <Button label="Edit details" secondary disabled={productsBusy} onPress={() => { void refreshProduct(p.id).then(() => setEditingProduct(p)).catch(report); }} style={{ flex: 1, marginRight: 6 }} />
    <Button label="Delete" secondary onPress={() => setDeletingProduct(p)} style={{ flex: 1, marginLeft: 6, borderColor: C.red, backgroundColor: C.soft }} />
   </View>
  </View>) : <Text style={S.small}>{productsLoading ? 'Loading inventory…' : productsError ? 'Inventory unavailable.' : 'No products match this stock status.'}</Text>}</Card>
  <Text style={[S.small, { marginTop: 12 }]}>Inventory changes are saved to your shop on the server.</Text>
  <EditStockModal key={editingProduct?.id || 'closed'} product={products.find(product => product.id === editingProduct?.id) ?? null} visible={!!editingProduct} close={() => setEditingProduct(null)} saveProduct={updateProduct} />
  <DeleteStockModal product={deletingProduct} visible={!!deletingProduct} cancel={() => setDeletingProduct(null)} confirm={() => { if (deletingProduct && !productsBusy) void deleteProduct(deletingProduct.id).then(() => setDeletingProduct(null)).catch(report); }} />
 </Page>;
}
export function Team() { const { C, S } = useShopUI();
 const { team } = useShop(); const [show, setShow] = useState(false);
 return <Page title="Your team" subtitle="Give staff clear roles to help run the store together."><Card><Text style={S.orderId}>Access at a glance</Text><Text style={[S.small, { lineHeight: 19, marginTop: 6 }]}>Owners manage the whole store. Managers oversee daily work. Staff can help with orders or stock.</Text></Card><View style={[S.row, { justifyContent: 'space-between', marginVertical: 13 }]}><Text style={S.orderId}>Team members ({team.length})</Text><Button label="＋ Invite staff" onPress={() => setShow(true)} /></View><Card>{team.map((person, index) => <View key={person.id} style={[S.productRow, index === team.length - 1 && { borderBottomWidth: 0 }]}><View style={S.avatar}><Text style={S.avatarText}>{person.initials}</Text></View><View style={{ flex: 1 }}><Text style={S.name}>{person.name}</Text><Text style={S.small}>{person.email}</Text></View><View style={{ alignItems: 'flex-end' }}><Badge value={person.role} /><Text style={[S.small, { color: C.green }]}>Active</Text></View></View>)}</Card><TeamModal visible={show} close={() => setShow(false)} /></Page>;
}
export function Store() { const { C, S } = useShopUI();
 const { account, shopLoading, shopError, refreshShop } = useShopAuth();
 const router = useRouter();
 const shop = account?.shop;
 const rows = shop ? [['Store name', shop.name], ['Categories', shop.categories.join(', ') || 'Not assigned'], ['Phone', shop.phone || 'Not provided'], ['Shop email', shop.email || 'Not provided'], ['Address', shop.address || 'Not provided'], ['Location', shop.location || 'Not provided'], ['Approval status', shop.status || 'Unavailable'], ['Description', shop.description || 'Not provided']] : [];
 return <Page title="Shop profile" subtitle="Your shop details from the server." onRefresh={refreshShop} loading={shopLoading}>
  {shopLoading ? <Text accessibilityLiveRegion="polite" style={S.small}>Loading your shop profile…</Text> : shopError ? <Card><Text accessibilityRole="alert" style={{ color: C.red, lineHeight: 20 }}>{shopError}</Text><Text style={[S.small, { lineHeight: 19, marginVertical: 12 }]}>A shop-owner role alone does not create a shop profile. The Shop record must be linked to this signed-in account on the server.</Text><Button label="Retry shop profile" onPress={refreshShop} /></Card> : shop ? <><Section>Store profile</Section><Card>{rows.map(([label, value], i) => <View key={label} style={[S.row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, paddingVertical: 14, borderBottomColor: C.line, borderBottomWidth: i === rows.length - 1 ? 0 : 1 }]}><Text style={S.small}>{label}</Text><Text style={[S.name, { flex: 1, fontSize: 12, textAlign: 'right', lineHeight: 19 }]}>{value}</Text></View>)}</Card></> : null}
  <Text style={[S.small, { marginTop: 16 }]}>Signed in as {account?.email || 'your Clerk account'}</Text>
  <Button label="Account settings →" onPress={() => router.navigate('/account')} style={{ marginTop: 16 }} />
 </Page>;
}

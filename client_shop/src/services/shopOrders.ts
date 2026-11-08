import { apiRequest } from '../lib/api';

export type ShopOrder = {
  id: string; number: string; customer: string; date: string; total: number;
  status: string; deliveryStatus: string; payment: string; address: string;
  items: { name: string; quantity: number; price: number; size: string }[];
  delivery: { id: string; driver: string; status: string } | null;
};
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const label = (value: unknown) => text(value, 'Unavailable').replace(/_/g, ' ');
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

export function parseShopOrder(value: unknown): ShopOrder {
  const order = object(value);
  if (!validId(order._id) || typeof order.totalAmount !== 'number' || !Number.isFinite(order.totalAmount) || order.totalAmount < 0 || !Array.isArray(order.items)) throw new Error('Invalid order response.');
  const address = object(order.shippingAddress);
  const date = new Date(text(order.createdAt));
  const delivery = order.delivery ? object(order.delivery) : null;
  if (delivery && (!validId(delivery._id) || typeof delivery.status !== 'string')) throw new Error('Invalid delivery response.');
  return {
    id: order._id, number: text(order.orderNumber, order._id),
    customer: text(object(order.user).name, text(address.fullName, 'Customer')),
    date: Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN'),
    total: order.totalAmount, status: label(order.orderStatus),
    deliveryStatus: order.delivery ? label(object(order.delivery).status) : 'Not assigned',
    delivery: delivery ? { id: delivery._id as string, driver: text(object(delivery.driver).fullName, 'Not assigned'), status: delivery.status as string } : null,
    payment: `${order.paymentMethod === 'cod' ? 'Cash on delivery' : label(order.paymentMethod)} · ${label(order.paymentStatus)}`,
    address: ['fullName', 'street', 'city', 'state', 'zipCode', 'country'].map(key => text(address[key])).filter(Boolean).join(', '),
    items: order.items.map(value => {
      const item = object(value);
      if (typeof item.quantity !== 'number' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) throw new Error('Invalid order item.');
      return { name: text(item.name, text(object(item.product).name, 'Unavailable product')), quantity: item.quantity, price: item.price, size: text(item.size) };
    }),
  };
}

async function readOrders(path: string, token: string, signal?: AbortSignal) {
  if (!token.trim()) throw new Error('Please sign in again to view orders.');
  const response = await apiRequest(path, { signal, headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const result = await response.json();
  if (result?.success !== true) throw new Error(result?.message || 'Unable to load orders.');
  return result;
}

export async function getShopOrderList(token: string, signal?: AbortSignal): Promise<ShopOrder[]> {
  const first = await readOrders('/api/shop/orders?page=1&limit=100', token, signal);
  if (!Array.isArray(first.data) || !Number.isSafeInteger(first.pagination?.pages) || first.pagination.pages < 0) throw new Error('Invalid shop orders response.');
  const orders = first.data.map(parseShopOrder) as ShopOrder[];
  for (let page = 2; page <= first.pagination.pages; page++) {
    const result = await readOrders(`/api/shop/orders?page=${page}&limit=100`, token, signal);
    if (!Array.isArray(result.data)) throw new Error('Invalid shop orders response.');
    orders.push(...result.data.map(parseShopOrder));
  }
  return [...new Map(orders.map(order => [order.id, order])).values()];
}

export async function getShopOrder(id: string, token: string, signal?: AbortSignal): Promise<ShopOrder> {
  if (!validId(id)) throw new Error('A valid order ID is required.');
  const result = await readOrders(`/api/orders/${encodeURIComponent(id)}`, token, signal);
  const order = parseShopOrder(result.data);
  if (order.id !== id) throw new Error('The server returned a different order.');
  return order;
}

export async function approveShopOrder(id: string, token: string): Promise<void> {
  if (!validId(id)) throw new Error('A valid order ID is required.');
  if (!token.trim()) throw new Error('Please sign in again to approve orders.');
  const response = await apiRequest(`/api/shop/orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT', headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus: 'processing' }),
  });
  const result = await response.json();
  if (result?.success !== true) throw new Error(result?.message || 'Unable to approve this order.');
  if (result.data?._id !== id || result.data?.orderStatus !== 'processing') throw new Error('Approval could not be confirmed. Refresh orders before trying again.');
}

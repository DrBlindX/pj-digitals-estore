import { isActiveDelivery } from './orderSummary';
import type { Delivery, Order, Product } from '../context/ShopDataContext';
import { isLowStock } from './stockAlerts';

export function getShopInsights(products: Product[], orders: Order[], deliveries: Delivery[]) {
  const eligible = orders.filter(order => order.status !== 'Cancelled');
  const orderValue = eligible.reduce((total, order) => total + order.total, 0);
  const completed = orders.filter(order => order.status === 'Delivered');
  return {
    orderValue, averageOrder: eligible.length ? orderValue / eligible.length : 0,
    completedValue: completed.reduce((total, order) => total + order.total, 0),
    completionRate: orders.length ? Math.round(completed.length / orders.length * 100) : 0,
    inventoryValue: products.reduce((total, product) => total + product.price * product.stock, 0),
    units: products.reduce((total, product) => total + product.stock, 0),
    lowStock: products.filter(isLowStock).sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)),
    inventory: [
      { label: 'Healthy stock · 6+', count: products.filter(product => !isLowStock(product)).length },
      { label: 'Low stock · 1–5', count: products.filter(product => product.stock > 0 && isLowStock(product)).length },
      { label: 'Out of stock', count: products.filter(product => product.stock === 0).length },
    ],
    orders: (['Placed', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'Status unavailable'] as const).map(status => ({ label: status, count: orders.filter(order => order.status === status).length })),
    delivered: deliveries.filter(delivery => delivery.status === 'Delivered').length,
    activeDeliveries: deliveries.filter(isActiveDelivery).length,
  };
}

import type { Delivery, Order, OrderStatus, DeliveryStatus } from '../context/ShopDataContext';
import type { ShopOrder } from '../services/shopOrders';

const orderLabels: Record<string, OrderStatus> = { placed: 'Placed', processing: 'Processing', shipping: 'Shipping', delivered: 'Delivered', cancelled: 'Cancelled' };
const deliveryLabels: Record<string, DeliveryStatus> = { assigned: 'Awaiting pickup', accepted: 'Awaiting pickup', picked_up: 'Picked up', on_the_way: 'Out for delivery', delivered: 'Delivered', failed: 'Failed', rejected: 'Rejected', cancelled: 'Cancelled' };
export function dashboardOrder(order: ShopOrder): Order {
  return { id: order.id, number: order.number, customer: order.customer, items: order.items.reduce((sum, item) => sum + item.quantity, 0), total: order.total, status: orderLabels[order.status] ?? 'Status unavailable', time: order.date };
}
export function dashboardDeliveries(orders: ShopOrder[]): Delivery[] {
  return orders.flatMap(order => order.delivery ? [{ id: order.delivery.id, orderId: order.id, orderNumber: order.number, customer: order.customer, address: order.address || 'Address unavailable', items: order.items.reduce((sum, item) => sum + item.quantity, 0), total: order.total, status: deliveryLabels[order.delivery.status] ?? 'Status unavailable', driver: order.delivery.driver, window: 'Delivery estimate not provided' }] : []);
}
export const isActiveOrder = (order: Order) => ['Placed', 'Processing', 'Shipping'].includes(order.status);
export const isActiveDelivery = (delivery: Delivery) => ['Awaiting pickup', 'Picked up', 'Out for delivery'].includes(delivery.status);

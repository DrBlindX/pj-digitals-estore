import { apiRequest } from '../lib/api';
import { readAdminPartners } from './partners';
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
export type DeliveryRow = { id: string; orderId: string; number: string; total: number; shop: string; status: string; driver: string };
async function request(path: string, token: string, options: RequestInit = {}) {
 if (!token.trim()) throw new Error('Please sign in again.');
 const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Delivery request failed.');
 return result;
}
export async function readDeliveries(page: number, unassigned: boolean, token: string, signal?: AbortSignal) {
 if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid delivery page.');
 const result = await request(`/api/admin/deliveries?page=${page}&limit=20${unassigned ? '&unassigned=true' : ''}`, token, { signal, cache: 'no-store' });
 if (!Array.isArray(result.data) || !Number.isSafeInteger(result.pagination?.pages) || result.pagination.pages < 0) throw new Error('Invalid deliveries response.');
 const rows: DeliveryRow[] = result.data.map((value: unknown) => {
  const row = object(value), order = unassigned ? row : object(row.order);
  if (!validId(row._id) || !validId(order._id) || typeof order.totalAmount !== 'number' || !Number.isFinite(order.totalAmount) || order.totalAmount < 0) throw new Error('Invalid delivery record.');
  const status = unassigned ? order.orderStatus : row.status;
  if (typeof status !== 'string') throw new Error('Delivery status unavailable.');
  return { id: row._id, orderId: order._id, number: typeof order.orderNumber === 'string' ? order.orderNumber : order._id, total: order.totalAmount, shop: typeof object(row.shop).name === 'string' ? object(row.shop).name as string : 'Shop unavailable', status, driver: typeof object(row.driver).fullName === 'string' ? object(row.driver).fullName as string : 'Partner unavailable' };
 });
 return { rows: [...new Map(rows.map(row => [row.id, row])).values()], pages: result.pagination.pages as number };
}
export async function availablePartners(token: string) {
 const first = await readAdminPartners(1, token);
 const partners = [...first.partners];
 for (let page = 2; page <= first.pages; page++) partners.push(...(await readAdminPartners(page, token)).partners);
 return [...new Map(partners.filter(partner => partner.status === 'approved' && partner.available).map(partner => [partner.id, partner])).values()];
}
export async function assignAdminDelivery(orderId: string, driverId: string, token: string) {
 if (!validId(orderId) || !validId(driverId)) throw new Error('Select a valid order and delivery partner.');
 const result = await request('/api/admin/deliveries', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, driverId }) });
 if (!validId(result.data?._id) || result.data?.order !== orderId || result.data?.driver !== driverId || result.data?.status !== 'assigned') throw new Error('Assignment could not be confirmed. Refresh before trying again.');
}
export async function cancelAdminDelivery(id: string, reason: string, token: string) {
 if (!validId(id) || !reason.trim()) throw new Error('Enter a cancellation reason.');
 const result = await request(`/api/admin/deliveries/${id}/cancel`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() }) });
 if (result.data?._id !== id || result.data?.status !== 'cancelled') throw new Error('Cancellation could not be confirmed. Refresh before trying again.');
}

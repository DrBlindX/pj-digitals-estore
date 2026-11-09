import { apiRequest } from '../lib/api';
export const shopStatuses = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type ShopStatus = typeof shopStatuses[number];
export type AdminShop = { id: string; name: string; status: ShopStatus; reason: string; owner: string; email: string; categories: string[]; location: string };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
function parse(value: unknown): AdminShop {
 const s = value as Record<string, unknown> | null;
 if (!s || !validId(s._id) || typeof s.name !== 'string' || !shopStatuses.includes(s.status as ShopStatus) || !Array.isArray(s.categories) || !s.categories.every(value => typeof value === 'string')) throw new Error('Invalid shop response.');
 const owner = s.owner && typeof s.owner === 'object' ? s.owner as Record<string, unknown> : {};
 return { id: s._id, name: s.name, status: s.status as ShopStatus, reason: typeof s.statusReason === 'string' ? s.statusReason : '', owner: typeof owner.name === 'string' ? owner.name : 'Owner unavailable', email: typeof owner.email === 'string' ? owner.email : '', categories: s.categories, location: typeof s.location === 'string' ? s.location : 'Location unavailable' };
}
async function request(path: string, token: string, options: RequestInit = {}) {
 if (!token.trim()) throw new Error('Please sign in again.');
 const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load shops.');
 return result;
}
export async function readAdminShops(page: number, token: string, signal?: AbortSignal) {
 if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid shop page.');
 const result = await request(`/api/admin/shops?page=${page}&limit=20`, token, { signal, cache: 'no-store' });
 if (!Array.isArray(result.data) || !Number.isSafeInteger(result.pagination?.pages) || result.pagination.pages < 0) throw new Error('Invalid shop list.');
 const shops: AdminShop[] = result.data.map(parse);
 return { shops: [...new Map(shops.map(shop => [shop.id, shop])).values()], pages: result.pagination.pages as number };
}
export async function updateAdminShopStatus(id: string, status: ShopStatus, reason: string, token: string) {
 if (!validId(id) || !shopStatuses.includes(status)) throw new Error('Invalid shop status request.');
 if (['rejected', 'suspended'].includes(status) && !reason.trim()) throw new Error('Enter a reason for rejection or suspension.');
 const result = await request(`/api/admin/shops/${id}/status`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason: reason.trim() || undefined }) });
 const shop = parse(result.data);
 if (shop.id !== id || shop.status !== status) throw new Error('Status could not be confirmed. Refresh before trying again.');
}

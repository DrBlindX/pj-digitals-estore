import { apiRequest } from '../lib/api';
export const userRoles = ['user', 'admin', 'dealer', 'shop_owner', 'delivery_partner'] as const;
export type UserRole = typeof userRoles[number];
export type AdminUser = { id: string; clerkId: string; name: string; email: string; role: UserRole };
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
function parse(value: unknown): AdminUser {
 const user = value as Record<string, unknown> | null;
 if (!user || !validId(user._id) || !userRoles.includes(user.role as UserRole)) throw new Error('Invalid user response.');
 return { id: user._id, clerkId: typeof user.clerkId === 'string' ? user.clerkId : '', name: typeof user.name === 'string' ? user.name : 'Name unavailable', email: typeof user.email === 'string' ? user.email : '', role: user.role as UserRole };
}
async function request(path: string, token: string, options: RequestInit = {}) {
 if (!token.trim()) throw new Error('Please sign in again.');
 const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load users.');
 return result;
}
export async function readAdminUsers(page: number, token: string, signal?: AbortSignal) {
 if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid user page.');
 const result = await request(`/api/admin/users?page=${page}&limit=20`, token, { signal, cache: 'no-store' });
 if (!Array.isArray(result.data) || !Number.isSafeInteger(result.pagination?.pages) || result.pagination.pages < 0) throw new Error('Invalid users response.');
 const users: AdminUser[] = result.data.map(parse);
 return { users: [...new Map(users.map(user => [user.id, user])).values()], pages: result.pagination.pages as number };
}
export async function updateAdminUserRole(id: string, role: UserRole, token: string) {
 if (!validId(id) || !userRoles.includes(role)) throw new Error('Invalid user role request.');
 const result = await request(`/api/admin/users/${id}/role`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
 const user = parse(result.data);
 if (user.id !== id || user.role !== role) throw new Error('Role change could not be confirmed. Refresh before trying again.');
}

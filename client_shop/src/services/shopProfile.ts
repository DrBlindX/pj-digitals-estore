import { apiRequest } from '../lib/api';

export type ShopProfile = {
  id: string; name: string; categories: string[]; phone: string; email: string;
  address: string; location: string; status: string; description: string;
};

export function parseShopProfile(value: unknown): ShopProfile {
  const shop = value as Record<string, unknown> | null;
  if (!shop || typeof shop._id !== 'string' || !/^[a-f\d]{24}$/i.test(shop._id) || typeof shop.name !== 'string' || !shop.name.trim()) throw new Error('The server returned an invalid shop profile.');
  const text = (key: string) => typeof shop[key] === 'string' ? (shop[key] as string).trim() : '';
  return { id: shop._id, name: text('name'), categories: Array.isArray(shop.categories) ? shop.categories.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [], phone: text('phone'), email: text('email'), address: text('addressLine'), location: text('location'), status: text('status'), description: text('description') };
}

export async function getShopProfile(token: string, signal?: AbortSignal) {
  if (!token) throw new Error('Please sign in again to load your shop.');
  const response = await apiRequest('/api/shop/me', { signal, headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const result = await response.json();
  if (result?.success !== true) throw new Error(result?.message || 'Unable to load your shop.');
  return parseShopProfile(result.data);
}

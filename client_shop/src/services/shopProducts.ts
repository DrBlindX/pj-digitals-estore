import { Platform } from 'react-native';
import { apiRequest } from '../lib/api';
import type { Product, NewProduct, ProductUpdate } from '../context/ShopDataContext';

export type ProductImage = { uri: string; name: string; type: string; file?: File };
const validId = (id: string) => /^[a-f\d]{24}$/i.test(id);
export function parseShopProduct(value: unknown): Product {
  const p = value as Record<string, unknown> | null;
  if (!p || typeof p._id !== 'string' || !validId(p._id) || typeof p.name !== 'string' || typeof p.category !== 'string' || typeof p.price !== 'number' || !Number.isFinite(p.price) || p.price < 0 || typeof p.stock !== 'number' || !Number.isSafeInteger(p.stock) || p.stock < 0 || !Array.isArray(p.images) || !p.images.every(image => typeof image === 'string')) throw new Error('Invalid product response.');
  return { id: p._id, name: p.name, category: p.category, price: p.price, stock: p.stock, isActive: typeof p.isActive === 'boolean' ? p.isActive : undefined, description: typeof p.description === 'string' ? p.description : '', images: p.images, sku: p._id.slice(-8).toUpperCase(), reorderLevel: 5, location: 'Your shop' };
}
async function request(path: string, token: string, options: RequestInit & { timeoutMs?: number } = {}) {
  if (!token) throw new Error('Please sign in again.');
  const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  const result = await response.json();
  if (result?.success !== true) throw new Error(result?.message || 'Product request failed.');
  return result;
}
const productPath = (id: string) => { if (!validId(id)) throw new Error('Invalid product ID.'); return `/api/products/${encodeURIComponent(id)}`; };
export async function listShopProducts(token: string, signal?: AbortSignal): Promise<Product[]> {
  const first = await request('/api/shop/products?page=1&limit=100', token, { signal });
  if (!Array.isArray(first.data) || !Number.isSafeInteger(first.pagination?.pages) || first.pagination.pages < 0) throw new Error('Invalid inventory response.');
  const products: Product[] = first.data.map(parseShopProduct);
  for (let page = 2; page <= first.pagination.pages; page++) {
    const result = await request(`/api/shop/products?page=${page}&limit=100`, token, { signal });
    if (!Array.isArray(result.data)) throw new Error('Invalid inventory page.');
    products.push(...result.data.map(parseShopProduct));
  }
  return [...new Map(products.map(product => [product.id, product])).values()];
}
export async function getShopProduct(id: string, token: string) { return parseShopProduct((await request(productPath(id), token)).data); }
export async function saveShopProduct(input: NewProduct | ProductUpdate, category: string, token: string, id?: string) {
  if (!input.name?.trim() || !input.description?.trim()) throw new Error('Enter a product name and description.');
  if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0 || typeof input.stock !== 'number' || !Number.isSafeInteger(input.stock) || input.stock < 0) throw new Error('Enter a valid price and whole-number stock.');
  const images = input.newImages ?? [];
  const kept = input.images ?? [];
  if ((!id || input.images !== undefined || images.length) && (kept.length + images.length < 1 || kept.length + images.length > 5)) throw new Error('Choose between 1 and 5 product images.');
  const form = new FormData();
  form.append('name', input.name.trim()); form.append('description', input.description.trim()); form.append('price', String(input.price)); form.append('stock', String(input.stock));
  if (!id) form.append('category', category);
  if (id && input.images !== undefined) form.append('existingImages', JSON.stringify(kept));
  for (const image of images) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(image.type)) throw new Error('Choose JPEG, PNG, WEBP or AVIF images.');
    if (Platform.OS === 'web') {
      if (!image.file) throw new Error('Select this image again before uploading.');
      form.append('images', image.file, image.name);
    } else form.append('images', { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
  }
  return parseShopProduct((await request(id ? productPath(id) : '/api/products', token, { method: id ? 'PUT' : 'POST', body: form, timeoutMs: 90000 })).data);
}
export async function setShopStock(id: string, adjust: number, token: string) {
  productPath(id);
  if (!Number.isSafeInteger(adjust) || adjust === 0) throw new Error('Stock adjustment must be a non-zero whole number.');
  return parseShopProduct((await request(`/api/shop/products/${id}/stock`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adjust }) })).data);
}
export async function removeShopProduct(id: string, token: string) { await request(productPath(id), token, { method: 'DELETE' }); }

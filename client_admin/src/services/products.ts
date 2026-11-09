import { apiRequest } from '../lib/api';
export type AdminProduct = { id: string; name: string; category: string; description: string; price: number; stock: number; images: string[]; active: boolean; shop: string };
function parse(value: unknown): AdminProduct {
 const p = value as Record<string, unknown> | null;
 if (!p || typeof p._id !== 'string' || !/^[a-f\d]{24}$/i.test(p._id) || typeof p.name !== 'string' || typeof p.category !== 'string' || typeof p.price !== 'number' || !Number.isFinite(p.price) || p.price < 0 || typeof p.stock !== 'number' || !Number.isSafeInteger(p.stock) || p.stock < 0 || !Array.isArray(p.images) || !p.images.every(image => typeof image === 'string') || typeof p.isActive !== 'boolean') throw new Error('Invalid product response.');
 const shop = p.shop && typeof p.shop === 'object' ? p.shop as Record<string, unknown> : {};
 return { id: p._id, name: p.name, category: p.category, price: p.price, stock: p.stock, images: p.images, active: p.isActive, description: typeof p.description === 'string' ? p.description : '', shop: typeof shop.name === 'string' ? shop.name : 'Shop unavailable' };
}
export async function readAdminProducts(page: number, id: string | null, token: string, signal?: AbortSignal) {
 if (!token.trim()) throw new Error('Please sign in again.');
 if (!Number.isSafeInteger(page) || page < 1 || (id && !/^[a-f\d]{24}$/i.test(id))) throw new Error('Invalid product request.');
 const response = await apiRequest(id ? `/api/products/${id}` : `/api/products?page=${page}&limit=20&includeInactive=true`, { signal, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load products.');
 if (id) { const product = parse(result.data); if (product.id !== id) throw new Error('Incorrect product returned.'); return { products: [product], pages: 1 }; }
 if (!Array.isArray(result.data) || !Number.isSafeInteger(result.pagination?.pages) || result.pagination.pages < 0) throw new Error('Invalid catalogue response.');
 const products: AdminProduct[] = result.data.map(parse);
 return { products: [...new Map(products.map(product => [product.id, product])).values()], pages: result.pagination.pages as number };
}

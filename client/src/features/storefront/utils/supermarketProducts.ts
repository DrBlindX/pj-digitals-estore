import type { Product } from '../data/types';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
// The API has no shared SKU: keep different names, categories and size options separate.
export function supermarketProductKey(product: Product): string {
  return JSON.stringify([normalize(product.name), normalize(product.serverCategory ?? product.category), [...new Set((product.sizes ?? []).map(normalize))].sort()]);
}

export function supermarketOffers(products: Product[], product: Product): Product[] {
  const key = supermarketProductKey(product);
  return products.filter(item => supermarketProductKey(item) === key && (item.stock ?? 0) > 5)
    .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0) || a.price - b.price || a.id.localeCompare(b.id));
}

export function groupSupermarketProducts(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = supermarketProductKey(product);
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return [...groups.values()].map(offers => supermarketOffers(offers, offers[0])[0] ?? { ...offers[0], stock: 0 });
}

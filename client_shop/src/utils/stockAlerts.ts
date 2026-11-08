export const LOW_STOCK_LIMIT = 6;
type StockItem = { id: string; stock: number };
export const isLowStock = (item: StockItem) => item.stock < LOW_STOCK_LIMIT;

export function newlyLowStock<T extends StockItem>(products: T[], previous: Map<string, number>) {
  return products.filter(product => isLowStock(product) && (!previous.has(product.id) || previous.get(product.id)! >= LOW_STOCK_LIMIT || product.stock < previous.get(product.id)!));
}

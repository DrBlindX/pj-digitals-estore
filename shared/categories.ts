export const shopCategories = ['Electronics', 'Textiles', 'Home Appliances', 'Computer Items', 'Bakery', 'Medical store', 'Furniture shop'] as const;
export const electronicsCategories = ['Electronics', 'Home Appliances', 'Computer Items', 'CCTV items', 'Power tools', 'Home decor', 'Mobilephone', 'Automobiles', 'Power inverter and solar'] as const;
export const productCategories = [...shopCategories, ...electronicsCategories.filter(value => !shopCategories.some(shop => shop === value as string))] as const;
export type ProductCategory = typeof productCategories[number];
export function categoriesForShop(shop: string): readonly string[] { return shop === 'Electronics' ? electronicsCategories : shopCategories.includes(shop as typeof shopCategories[number]) ? [shop] : []; }

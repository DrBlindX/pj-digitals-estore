import { useShopOrders } from '../hooks/useShopOrders';
import type { ShopOrder } from '../services/shopOrders';
import { useShopProducts } from '../hooks/useShopProducts';
import type { ProductImage } from '../services/shopProducts';
import { createContext, useContext, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { useShopAuth } from './ShopAuthContext';

export type Product = {
  id: string; name: string; category: string; sku: string; price: number;
  stock: number; reorderLevel: number; location: string;
  description?: string; images?: string[]; isActive?: boolean;
};
export type OrderStatus = 'Placed' | 'Processing' | 'Shipping' | 'Delivered' | 'Cancelled' | 'Status unavailable';
export type Order = { id: string; number: string; customer: string; items: number; total: number; status: OrderStatus; time: string };
export type DeliveryStatus = 'Awaiting pickup' | 'Picked up' | 'Out for delivery' | 'Delivered' | 'Failed' | 'Rejected' | 'Cancelled' | 'Status unavailable';
export type Delivery = { id: string; orderId: string; orderNumber: string; customer: string; address: string; items: number; total: number; status: DeliveryStatus; driver: string; window: string };
export type TeamMember = { id: string; name: string; email: string; role: string; initials: string };
export type NewProduct = Pick<Product, 'name' | 'description' | 'price' | 'stock'> & { newImages: ProductImage[]; images?: string[] };
export type ProductUpdate = Partial<Omit<Product, 'id' | 'category'>> & { newImages?: ProductImage[] };
export type NewTeamMember = Pick<TeamMember, 'name' | 'email' | 'role'>;

type ShopContextValue = {
  ordersLoading: boolean; ordersError: string; reloadOrders: () => void; serverOrders: ShopOrder[];
  shopCategory: string | null; productsLoading: boolean; productsBusy: boolean; productsError: string; reloadProducts: () => void; refreshProduct: (id: string) => Promise<void>;
  products: Product[]; orders: Order[]; deliveries: Delivery[]; team: TeamMember[];
  isOpen: boolean; setIsOpen: Dispatch<SetStateAction<boolean>>;
  addProduct: (product: NewProduct) => Promise<void>;
  changeStock: (id: string, amount: number) => Promise<void>;
  updateProduct: (id: string, details: ProductUpdate) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMember: (member: NewTeamMember) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);
const initialTeam: TeamMember[] = [
  { id: 't1', name: 'Vijay Varghese', email: 'owner@tdpstore.example', role: 'Owner', initials: 'VV' },
  { id: 't2', name: 'Anjali Mathew', email: 'manager@tdpstore.example', role: 'Store manager', initials: 'AM' },
  { id: 't3', name: 'Arun Raj', email: 'staff@tdpstore.example', role: 'Order staff', initials: 'AR' },
];

export function ShopDataProvider({ children }: PropsWithChildren) {
  const { account } = useShopAuth();
  const shopCategory = account?.category ?? null;
  const productApi = useShopProducts();
  const { products, addProduct, updateProduct, changeStock, deleteProduct, refreshProduct } = productApi;
  const orderApi = useShopOrders();
  const { orders, deliveries } = orderApi;
  const [team, setTeam] = useState(initialTeam);
  const [isOpen, setIsOpen] = useState(true);
  const addMember = (member: NewTeamMember) => setTeam((all) => [...all, { ...member, id: `t${Date.now()}`, initials: member.name.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase() }]);
  const value: ShopContextValue = { shopCategory, products, orders, deliveries, team, isOpen, setIsOpen, addProduct, changeStock, updateProduct, deleteProduct, addMember, refreshProduct,
    ordersLoading: orderApi.loading, ordersError: orderApi.error, reloadOrders: orderApi.reload, serverOrders: orderApi.rawOrders,
    productsLoading: productApi.loading, productsBusy: productApi.busy, productsError: productApi.error, reloadProducts: productApi.reload };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error('useShop must be inside ShopDataProvider');
  return value;
}

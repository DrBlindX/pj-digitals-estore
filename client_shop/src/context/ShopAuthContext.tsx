import { createContext, useCallback, useContext, type PropsWithChildren } from 'react';
import { useAuth, useClerk, useUser } from '../auth/clerkHooks';

export const shopCategories = ['Electronics', 'Textiles', 'Home Appliances', 'Computer Items', 'Bakery'] as const;
export type ShopCategory = typeof shopCategories[number];
type Account = { id: string; shopName: string; email: string; category: ShopCategory | null };
type Auth = { account: Account | null; ready: boolean; getToken: () => Promise<string | null>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);

export function assignedShopCategory(value: unknown): ShopCategory | null {
  return typeof value === 'string' ? shopCategories.find(category => category.toLowerCase() === value.trim().toLowerCase()) ?? null : null;
}

export function ShopAuthProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId, getToken: clerkGetToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const clerk = useClerk();
  const logout = useCallback(async () => { await clerk.signOut(); }, [clerk]);
  const getToken = useCallback(() => clerkGetToken(), [clerkGetToken]);
  const metadata = user?.publicMetadata;
  const shopName = typeof metadata?.shopName === 'string' ? metadata.shopName.trim() : '';
  const account: Account | null = isSignedIn && userId && userLoaded ? {
    id: userId, shopName: shopName || 'Your shop', email: user?.primaryEmailAddress?.emailAddress ?? '',
    category: assignedShopCategory(metadata?.shopCategory),
  } : null;
  return <Context.Provider value={{ account, ready: !!isLoaded && !!userLoaded, logout, getToken }}>{children}</Context.Provider>;
}

export function useShopAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('ShopAuthProvider is required');
  return value;
}

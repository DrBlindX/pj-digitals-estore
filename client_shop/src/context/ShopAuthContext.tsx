import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth, useClerk, useUser } from '../auth/clerkHooks';
import { getShopProfile, type ShopProfile } from '../services/shopProfile';

export const shopCategories = ['Electronics', 'Textiles', 'Home Appliances', 'Computer Items', 'Bakery'] as const;
export type ShopCategory = typeof shopCategories[number];
type Account = { id: string; profileName: string; shopName: string; email: string; category: ShopCategory | null; shop: ShopProfile | null };
type Auth = { account: Account | null; ready: boolean; getToken: () => Promise<string | null>; logout: () => Promise<void>; shopLoading: boolean; shopError: string; refreshShop: () => void };
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
  const [attempt, setAttempt] = useState(0);
  const [loadedShop, setLoadedShop] = useState<{ owner: string; shop: ShopProfile | null; error: string } | null>(null);
  useEffect(() => {
    if (!isLoaded || !userLoaded || !isSignedIn || !userId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again to load your shop.');
        const shop = await getShopProfile(token, controller.signal);
        if (!controller.signal.aborted) setLoadedShop({ owner: userId, shop, error: '' });
      } catch (cause) {
        if (!controller.signal.aborted) setLoadedShop({ owner: userId, shop: null, error: cause instanceof Error ? cause.message : 'Unable to load your shop.' });
      }
    })();
    return () => controller.abort();
  }, [isLoaded, userLoaded, isSignedIn, userId, getToken, attempt]);
  const currentShop = loadedShop?.owner === userId ? loadedShop : null;
  const shopLoading = !!isSignedIn && !!userLoaded && !currentShop;
  const shop = currentShop?.shop ?? null;
  const refreshShop = useCallback(() => { setLoadedShop(null); setAttempt(value => value + 1); }, []);
  const account: Account | null = isSignedIn && userId && userLoaded ? {
    id: userId, profileName: user?.fullName?.trim() || user?.firstName?.trim() || user?.username?.trim() || '', shopName: shop?.name ?? (shopLoading ? 'Loading shop…' : 'Shop unavailable'), email: user?.primaryEmailAddress?.emailAddress ?? '',
    category: assignedShopCategory(shop?.categories[0]), shop,
  } : null;
  return <Context.Provider value={{ account, ready: !!isLoaded && !!userLoaded, logout, getToken, shopLoading, shopError: currentShop?.error ?? '', refreshShop }}>{children}</Context.Provider>;
}

export function useShopAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('ShopAuthProvider is required');
  return value;
}

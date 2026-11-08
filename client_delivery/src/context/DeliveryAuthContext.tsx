import { createContext, useCallback, useContext, type PropsWithChildren } from 'react';
import { useAuth, useClerk, useUser } from '../auth/clerkHooks';

type Partner = { id: string; name: string; email: string };
type Auth = { partner: Partner | null; ready: boolean; getToken: () => Promise<string | null>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);

export function DeliveryAuthProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const logout = useCallback(() => clerk.signOut(), [clerk]);
  const partner = isSignedIn && userId ? {
    id: userId,
    name: user?.fullName || user?.firstName || 'Delivery partner',
    email: user?.primaryEmailAddress?.emailAddress || '',
  } : null;
  return <Context.Provider value={{ partner, ready: !!isLoaded, getToken, logout }}>{children}</Context.Provider>;
}

export function useDeliveryAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('DeliveryAuthProvider is required.');
  return value;
}

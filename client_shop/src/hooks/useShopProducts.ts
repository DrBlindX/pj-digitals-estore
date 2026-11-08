import { useCallback, useEffect, useRef, useState } from 'react';
import { useShopAuth } from '../context/ShopAuthContext';
import { getShopProduct, listShopProducts, removeShopProduct, saveShopProduct, setShopStock } from '../services/shopProducts';
import type { NewProduct, Product, ProductUpdate } from '../context/ShopDataContext';

export function useShopProducts() {
  const { account, getToken } = useShopAuth();
  const owner = account?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner: string; products: Product[]; error: string; loading: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again.');
        const products = await listShopProducts(token, controller.signal);
        if (!controller.signal.aborted) setState({ owner, products, error: '', loading: false });
      } catch (cause) {
        if (!controller.signal.aborted) setState(previous => ({ owner, products: previous?.owner === owner ? previous.products : [], loading: false, error: cause instanceof Error ? cause.message : 'Unable to load inventory.' }));
      }
    })();
    return () => controller.abort();
  }, [owner, getToken, attempt]);
  const current = state?.owner === owner ? state : null;
  const mutate = useCallback(async (action: (token: string) => Promise<Product | string>) => {
    if (!owner || state?.owner !== owner || state.loading || state.error) throw new Error('Reload your inventory before making changes.');
    if (lock.current) throw new Error('Wait for the current product change to finish.');
    lock.current = true; setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in again.');
      if (!mounted.current) throw new Error('Your sign-in session changed.');
      const result = await action(token);
      if (mounted.current) setState(previous => previous?.owner !== owner ? previous : { ...previous, products: typeof result === 'string' ? previous.products.filter(product => product.id !== result) : [result, ...previous.products.filter(product => product.id !== result.id)] });
    } catch (cause) {
      if (mounted.current) setState(previous => previous ? { ...previous, error: `${cause instanceof Error ? cause.message : 'Product request failed.'} Reload inventory to check the saved state before trying again.` } : previous);
      throw cause;
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, [owner, state, getToken]);
  const reload = useCallback(() => { if (!lock.current) { setState(previous => previous ? { ...previous, loading: true, error: '' } : previous); setAttempt(value => value + 1); } }, []);
  return {
    products: current?.products ?? [], loading: !!owner && (!current || current.loading), busy,
    error: current?.error ?? '', reload,
    addProduct: async (input: NewProduct) => { if (!account?.category) throw new Error('Your shop category is not assigned. Contact the admin.'); await mutate(token => saveShopProduct(input, account.category!, token)); },
    updateProduct: async (id: string, input: ProductUpdate) => { if (!current?.products.some(product => product.id === id)) throw new Error('Reload this product first.'); await mutate(token => saveShopProduct(input, '', token, id)); },
    changeStock: async (id: string, amount: number) => { await mutate(token => setShopStock(id, amount, token)); },
    deleteProduct: async (id: string) => { await mutate(async token => { await removeShopProduct(id, token); return id; }); },
    refreshProduct: async (id: string) => {
      const product = current?.products.find(product => product.id === id);
      if (!product) throw new Error('Reload this product first.');
      // The public single-product endpoint hides inactive items; the owner list supplies their fields.
      if (product.isActive === false) return;
      await mutate(token => getShopProduct(id, token));
    },
  };
}

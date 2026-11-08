import { useCallback, useEffect, useState } from 'react';
import { useShopAuth } from '../context/ShopAuthContext';
import { getShopOrderList, type ShopOrder } from '../services/shopOrders';
import { dashboardDeliveries, dashboardOrder } from '../utils/orderSummary';

export function useShopOrders() {
  const { account, getToken } = useShopAuth();
  const owner = account?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner: string; orders: ShopOrder[]; error: string } | null>(null);
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again.');
        const orders = await getShopOrderList(token, controller.signal);
        if (!controller.signal.aborted) setState({ owner, orders, error: '' });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ owner, orders: [], error: cause instanceof Error ? cause.message : 'Unable to load shop orders.' });
      }
    })();
    return () => controller.abort();
  }, [owner, getToken, attempt]);
  const current = state?.owner === owner ? state : null;
  const rawOrders = current?.orders ?? [];
  const reload = useCallback(() => { setState(null); setAttempt(value => value + 1); }, []);
  return { rawOrders, orders: rawOrders.map(dashboardOrder), deliveries: dashboardDeliveries(rawOrders), loading: !!owner && !current, error: current?.error ?? '', reload };
}

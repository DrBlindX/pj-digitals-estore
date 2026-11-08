import { useCallback, useEffect, useState } from 'react';
import { useShopAuth } from '../context/ShopAuthContext';
import { apiRequest } from '../lib/api';

export function useShopReport<T>(path: string, parse: (data: unknown) => T) {
  const { account, getToken } = useShopAuth();
  const owner = account?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner: string; data: T | null; error: string } | null>(null);
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error('Please sign in again.');
        const response = await apiRequest(path, { signal: controller.signal, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
        const result = await response.json();
        if (result?.success !== true) throw new Error(result?.message || 'Unable to load report.');
        const data = parse(result.data);
        if (!controller.signal.aborted) setState({ owner, data, error: '' });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ owner, data: null, error: cause instanceof Error ? cause.message : 'Unable to load report.' });
      }
    })();
    return () => controller.abort();
  }, [owner, getToken, path, parse, attempt]);
  const current = state?.owner === owner ? state : null;
  const reload = useCallback(() => { setState(null); setAttempt(value => value + 1); }, []);
  return { data: current?.data ?? null, error: current?.error ?? '', loading: !!owner && !current, reload };
}

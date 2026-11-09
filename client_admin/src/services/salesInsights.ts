import { apiRequest } from '../lib/api';
export type SalesPoint = { date: string; orders: number; gross: number; collected: number };
export function parseSalesInsights(value: unknown): SalesPoint[] {
 const data = value as { rows?: unknown } | null;
 if (!data || !Array.isArray(data.rows)) throw new Error('Invalid sales insight response.');
 const seen = new Set<string>();
 return data.rows.map((value: unknown) => {
  const row = value as Record<string, unknown> | null;
  if (!row || typeof row.period !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.period) || !Number.isFinite(Date.parse(row.period)) || new Date(row.period).toISOString().slice(0,10) !== row.period || seen.has(row.period)) throw new Error('Invalid sales insight date.');
  seen.add(row.period);
  if (typeof row.orders !== 'number' || !Number.isSafeInteger(row.orders) || row.orders < 0 || typeof row.gross !== 'number' || !Number.isFinite(row.gross) || row.gross < 0 || typeof row.collected !== 'number' || !Number.isFinite(row.collected) || row.collected < 0) throw new Error('Invalid sales insight totals.');
  return { date: row.period, orders: row.orders, gross: row.gross, collected: row.collected };
 }).sort((a,b) => a.date.localeCompare(b.date));
}
export async function readSalesInsights(days: 7 | 30, token: string, signal?: AbortSignal) {
 if (![7,30].includes(days) || !token.trim()) throw new Error('Sign in and select a valid insight period.');
 const to = new Date(), from = new Date(to.getTime() - days * 86400000);
 const response = await apiRequest(`/api/admin/reports/sales?groupBy=day&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, { signal, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load sales insights.');
 return parseSalesInsights(result.data);
}

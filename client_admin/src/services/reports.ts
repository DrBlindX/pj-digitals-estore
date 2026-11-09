import { apiRequest } from '../lib/api';
export type ReportKind = 'Overview' | 'Payouts' | 'Support' | 'Reports';
export type Report = { metrics: { label: string; value: string }[]; rows: { id: string; title: string; lines: string[] }[]; pages: number; note: string };
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown, fallback = 'Unavailable') => typeof v === 'string' && v ? v : fallback;
function number(v: unknown) { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new Error('Invalid numeric report data.'); return v; }
const money = (v: unknown) => `₹${number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const array = (v: unknown): unknown[] => { if (!Array.isArray(v)) throw new Error('Invalid report records.'); return v; };
const id = (v: unknown) => { if (typeof v !== 'string' || !/^[a-f\d]{24}$/i.test(v)) throw new Error('Invalid report record ID.'); return v; };
export async function readAdminReport(kind: ReportKind, page: number, token: string, signal?: AbortSignal): Promise<Report> {
 if (!token.trim()) throw new Error('Please sign in again.');
 if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid report page.');
 const paths: Record<ReportKind, string> = { Overview: '/api/admin/stats', Payouts: `/api/admin/settlements?page=${page}&limit=20`, Support: `/api/admin/tickets?page=${page}&limit=20`, Reports: '/api/admin/reports/sales' };
 const response = await apiRequest(paths[kind], { signal, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load report.');
 const data = object(result.data);
 if (kind === 'Overview') {
  const pending = object(data.pending), deliveries = object(data.deliveries);
  const metrics = [{label:'Paid revenue · all time',value:money(data.totalRevenue)}, ...[['Total orders',data.totalOrders],['Users',data.totalUsers],['Products',data.totalProducts],['Pending shops',pending.shops],['Pending partners',pending.deliveryPartners],['Active deliveries',deliveries.active],['Orders awaiting assignment',deliveries.ordersAwaitingAssignment]].map(([label,value])=>({label:String(label),value:String(number(value))}))];
  return { metrics, rows: array(data.recentOrders).map(value=> { const row=object(value);return {id:id(row._id),title:text(row.orderNumber),lines:[text(object(row.user).name),money(row.totalAmount),`Order: ${text(row.orderStatus)}`,`Payment: ${text(row.paymentStatus)}`]}; }), pages:1, note:'Latest orders. Paid revenue excludes cancelled orders; all totals are supplied by the server.' };
 }
 if (kind === 'Reports') {
  const totals=object(data.totals);
  return { metrics:[{label:'Orders',value:String(number(totals.orders))},{label:'Gross order value',value:money(totals.gross)},{label:'Collected payments',value:money(totals.collected)}], rows:array(data.rows).map(value=>{const row=object(value); const period=text(row.period,''); if(!period)throw new Error('Invalid report period.'); return {id:period,title:period,lines:[`${number(row.orders)} orders`,`Order value: ${money(row.gross)}`,`Collected: ${money(row.collected)}`]};}), pages:1,note:`${text(data.from).slice(0,10)} – ${text(data.to).slice(0,10)} · Non-cancelled orders. Order value and collected payments are separate totals.` };
 }
 const pages=number(object(result.pagination).pages);if(!Number.isSafeInteger(pages))throw new Error('Invalid report pagination.');
 const rows=array(result.data).map(value=>{const row=object(value);return kind==='Payouts' ? {id:id(row._id),title:text(object(row.shop).name,'Shop unavailable'),lines:[`Status: ${text(row.status)}`,`Net payable: ${money(row.netPayable)}`,`Gross sales: ${money(row.grossSales)}`,`Commission: ${money(row.commission)}`,`Period: ${text(row.periodFrom).slice(0,10)} – ${text(row.periodTo).slice(0,10)}`,`Reference: ${text(row.reference)}`]} : {id:id(row._id),title:text(row.subject),lines:[`${text(object(row.user).name)} · ${text(object(row.user).email)}`,`Status: ${text(row.status)}`,`Category: ${text(row.category)}`]};});
 return {metrics:[],rows:[...new Map(rows.map(row=>[row.id,row])).values()],pages,note:kind==='Payouts'?'Settlement records supplied by the server. Viewing a record does not transfer funds.':'Support tickets supplied by the server.'};
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const amount = (value: unknown): number => { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid report amount.'); return value; };
export function parseShopStats(value: unknown) {
  const data = record(value);
  return { periodDays: amount(data.periodDays), orders: amount(data.orders), sales: amount(data.sales), paidSales: amount(data.paidSales), productCount: amount(data.productCount) };
}
export function parseSettlements(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Invalid settlement response.');
  const rows = value.map(value => {
    const row = record(value);
    if (typeof row._id !== 'string' || !/^[a-f\d]{24}$/i.test(row._id) || typeof row.status !== 'string') throw new Error('Invalid settlement record.');
    return { id: row._id, status: row.status, netPayable: amount(row.netPayable), grossSales: amount(row.grossSales), commission: amount(row.commission), reference: typeof row.reference === 'string' ? row.reference : '', periodFrom: typeof row.periodFrom === 'string' ? row.periodFrom : '', periodTo: typeof row.periodTo === 'string' ? row.periodTo : '' };
  });
  return [...new Map(rows.map(row => [row.id, row])).values()];
}

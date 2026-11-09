import { apiRequest } from '../lib/api';
export const partnerStatuses = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type PartnerStatus = typeof partnerStatuses[number];
export type AdminPartner = { id: string; name: string; status: PartnerStatus; reason: string; email: string; phone: string; locations: string[]; vehicle: string; available: boolean };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
function parse(value: unknown): AdminPartner {
 const s = value as Record<string, unknown> | null;
 if (!s || !validId(s._id) || typeof s.fullName !== 'string' || !partnerStatuses.includes(s.status as PartnerStatus) || !Array.isArray(s.serviceLocations) || !s.serviceLocations.every(value => typeof value === 'string') || typeof s.isAvailable !== 'boolean') throw new Error('Invalid delivery partner response.');
 const user = s.user && typeof s.user === 'object' ? s.user as Record<string, unknown> : {};
 return { id: s._id, name: s.fullName, status: s.status as PartnerStatus, reason: typeof s.statusReason === 'string' ? s.statusReason : '', email: typeof user.email === 'string' ? user.email : '', phone: typeof s.phone === 'string' ? s.phone : '', locations: s.serviceLocations, vehicle: [s.vehicleType, s.vehicleNumber].filter(value => typeof value === 'string' && value).join(' · '), available: s.isAvailable };
}
async function request(path: string, token: string, options: RequestInit = {}) {
 if (!token.trim()) throw new Error('Please sign in again.');
 const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to load partners.');
 return result;
}
export async function readAdminPartners(page: number, token: string, signal?: AbortSignal) {
 if (!Number.isSafeInteger(page) || page < 1) throw new Error('Invalid partner page.');
 const result = await request(`/api/admin/delivery-partners?page=${page}&limit=20`, token, { signal, cache: 'no-store' });
 if (!Array.isArray(result.data) || !Number.isSafeInteger(result.pagination?.pages) || result.pagination.pages < 0) throw new Error('Invalid partner list.');
 const partners: AdminPartner[] = result.data.map(parse);
 return { partners: [...new Map(partners.map(partner => [partner.id, partner])).values()], pages: result.pagination.pages as number };
}
export async function updateAdminPartnerStatus(id: string, status: PartnerStatus, reason: string, token: string) {
 if (!validId(id) || !partnerStatuses.includes(status)) throw new Error('Invalid partner status request.');
 if (['rejected', 'suspended'].includes(status) && !reason.trim()) throw new Error('Enter a reason for rejection or suspension.');
 const result = await request(`/api/admin/delivery-partners/${id}/status`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason: reason.trim() || undefined }) });
 const partner = parse(result.data);
 if (partner.id !== id || partner.status !== status) throw new Error('Status could not be confirmed. Refresh before trying again.');
}

import { apiRequest } from '../lib/api';

export type DeliveryProfile = {
  _id?: string; id?: string; fullName?: string; name?: string; phone?: string;
  vehicleType?: string; vehicleNumber?: string; serviceLocations?: string[];
  isAvailable?: boolean; availability?: boolean; status?: string;
  [key: string]: unknown;
};
export type DeliveryRecord = Record<string, unknown>;

async function request<T>(path: string, token: string, method = 'GET', body?: unknown): Promise<T> {
  if (!token.trim()) throw new Error('Sign in again to continue.');
  const response = await apiRequest(path, {
    method,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const bodyText = await response.text();
  if (!bodyText) return {} as T;
  let result: { success?: unknown; message?: string; data?: unknown };
  try { result = JSON.parse(bodyText) as typeof result; }
  catch { throw new Error('The server returned invalid JSON. Check the API URL and server response.'); }
  if (result?.success === false) throw new Error(result.message || 'The request could not be completed.');
  return (result?.data ?? result) as T;
}

export const getDeliveryProfile = (token: string) => request<DeliveryProfile>('/api/delivery/me', token);
export const updateDeliveryProfile = (token: string, profile: Partial<DeliveryProfile>) => request<DeliveryProfile>('/api/delivery/me', token, 'PUT', profile);
export const setAvailability = (token: string, isAvailable: boolean) => request<DeliveryProfile>('/api/delivery/availability', token, 'PUT', { isAvailable });
export const updateLocation = (token: string, latitude: number, longitude: number) => request<DeliveryProfile>('/api/delivery/location', token, 'PUT', { lat: latitude, lng: longitude });
export async function getJobs(token: string, all = false) {
  const result = await request<DeliveryRecord[] | { jobs?: DeliveryRecord[] }>(`/api/delivery/jobs${all ? '?scope=all' : ''}`, token);
  return Array.isArray(result) ? result : result.jobs ?? [];
}
export const getJob = (token: string, id: string) => request<DeliveryRecord>(`/api/delivery/jobs/${encodeURIComponent(id)}`, token);
export const updateJobStatus = (token: string, id: string, status: string) => request<DeliveryRecord>(`/api/delivery/jobs/${encodeURIComponent(id)}/status`, token, 'PUT', { status });
export async function getDeliveryHistory(token: string) {
  const result = await request<DeliveryRecord[] | { history?: DeliveryRecord[]; jobs?: DeliveryRecord[] }>('/api/delivery/history', token);
  return Array.isArray(result) ? result : result.history ?? result.jobs ?? [];
}
export const applyForDelivery = (token: string, application: { fullName: string; phone: string; vehicleType: string; vehicleNumber: string; serviceLocations: string[] }) =>
  request<DeliveryRecord>('/api/delivery/apply', token, 'POST', application);

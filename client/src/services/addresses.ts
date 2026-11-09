import { apiRequest } from '../lib/api';
import type { DeliveryAddress } from '../features/storefront/components/AddressBook';
export type AddressDraft = Omit<DeliveryAddress, 'id'>;
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
function parse(value: unknown): DeliveryAddress {
 const row = value as Record<string, unknown> | null;
 if (!row || !validId(row._id) || typeof row.fullName !== 'string' || typeof row.phone !== 'string' || typeof row.street !== 'string' || typeof row.zipCode !== 'string') throw new Error('Invalid saved address.');
 const area = typeof row.location === 'string' && row.location.trim() ? row.location : row.city;
 const location = typeof area === 'string' ? ['Thodupuzha','Muttom'].find(value=>value.toLowerCase()===area.trim().toLowerCase()) : undefined;
 if (!location) throw new Error('A saved address has an unsupported delivery area.');
 return { id: row._id, name: row.fullName, phone: row.phone, address: row.street, pincode: row.zipCode, location: location as DeliveryAddress['location'] };
}
async function request(path: string, token: string, options: RequestInit = {}) {
 if (!token.trim()) throw new Error('Sign in to save addresses.');
 const response = await apiRequest(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
 const result = await response.json();
 if (result?.success !== true) throw new Error(result?.message || 'Unable to save addresses.');
 return result;
}
export async function listAddresses(token: string, signal?: AbortSignal) {
 const result = await request('/api/address',token,{signal,cache:'no-store'});
 if (!Array.isArray(result.data)) throw new Error('Invalid saved address list.');
 const addresses: DeliveryAddress[] = result.data.map(parse);
 return [...new Map(addresses.map(address=>[address.id,address])).values()];
}
export async function saveAddress(input: AddressDraft, token: string) {
 if (!input.name.trim() || !/^\d{10}$/.test(input.phone.replace(/\s/g,'')) || input.address.trim().length<5 || !/^\d{6}$/.test(input.pincode) || !['Thodupuzha','Muttom'].includes(input.location)) throw new Error('Enter a complete delivery address.');
 const result = await request('/api/address',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'Home',fullName:input.name.trim(),phone:input.phone.replace(/\s/g,''),street:input.address.trim(),city:input.location,location:input.location,state:'Kerala',zipCode:input.pincode,country:'India'})});
 return parse(result.data);
}
export async function removeAddress(id: string,token: string) {
 if (!validId(id)) throw new Error('Invalid saved address ID.');
 await request(`/api/address/${id}`,token,{method:'DELETE'});
}

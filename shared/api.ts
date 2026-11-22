import { API_BASE_URL } from './apiConfig';

export type ApiRequestOptions = RequestInit & { timeoutMs?: number };

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Use a server-relative API path.');
  const { timeoutMs = 8000, ...requestOptions } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, signal: controller.signal });
    if (!response.ok) {
      let message = `Server request failed (${response.status}).`;
      try {
        const result = await response.json();
        const detail = result?.message ?? result?.massage ?? result?.error ?? result?.errors?.[0]?.message;
        if (typeof detail === 'string' && detail.trim()) message = detail;
      } catch { /* Keep the HTTP status when a gateway returns HTML. */ }
      throw new Error(message);
    }
    return response;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export async function checkServer(signal?: AbortSignal) {
  const response = await apiRequest('/', { signal, headers: { Accept: 'text/plain' }, cache: 'no-store' });
  if ((await response.text()).trim() !== 'Server is Live!') throw new Error('Unexpected server response.');
}

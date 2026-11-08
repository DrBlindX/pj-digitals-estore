import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseURL() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid server address.');
    return configured.replace(/\/$/, '');
  }
  if (!__DEV__) throw new Error('The server address has not been configured.');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `http://${window.location.hostname || 'localhost'}:3000`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost')}:3000`;
}

export async function apiRequest(path: string, options: RequestInit & { timeoutMs?: number } = {}) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Use a server-relative API path.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const { timeoutMs = 8000, ...requestOptions } = options;
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`${getBaseURL()}${path}`, { ...requestOptions, signal: controller.signal });
    if (!response.ok) {
      let message = `Server request failed (${response.status}).`;
      try { const result = await response.json(); if (typeof result.message === 'string') message = result.message; } catch { /* Non-JSON server response. */ }
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

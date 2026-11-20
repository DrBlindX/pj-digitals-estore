/** Inspect only Clerk responses during sign-in. Never record bodies, tokens or query strings. */
export async function withClerkResponseDiagnostics<T>(frontendApi: string, operation: () => Promise<T>): Promise<T> {
  const origin = new URL(`https://${frontendApi}`).origin;
  const originalFetch = globalThis.fetch;
  let diagnostic = '';
  const inspectFetch: typeof fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let url: URL;
    try { url = new URL(address); } catch { return response; }
    if (url.origin !== origin || !url.pathname.startsWith('/v1/') || response.status === 204) return response;
    try {
      await response.clone().json();
    } catch {
      const type = (response.headers.get('content-type') ?? 'unknown content type').split(';')[0];
      diagnostic = `Clerk returned unreadable JSON at ${url.pathname} (HTTP ${response.status}, ${type}). Try without VPN or network filtering, or switch Wi-Fi/mobile data.`;
    }
    return response;
  };
  globalThis.fetch = inspectFetch;
  try {
    return await operation();
  } catch (error) {
    if (diagnostic) throw new Error(diagnostic);
    throw error;
  } finally {
    if (globalThis.fetch === inspectFetch) globalThis.fetch = originalFetch;
  }
}

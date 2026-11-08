// Clerk verifies the original callback. This only prevents unmatched app routes.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const url = new URL(path, 'nearby-shop://app');
    const callbackPath = /(?:^|\/)hosted-auth-callback\/?$/.test(url.pathname);
    const callbackHost = !['http:', 'https:'].includes(url.protocol) && (url.hostname === 'hosted-auth-callback' || url.hostname === 'callback' || (url.protocol === 'clerk:' && url.hostname.endsWith('.hosted-callback')));
    if (callbackPath || callbackHost) return '/';
  } catch { /* Keep unrelated links unchanged. */ }
  return path;
}

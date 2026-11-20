const screenBackHandlers = new Set<() => boolean>();
export function registerScreenBack(handler: () => boolean) {
  screenBackHandlers.add(handler);
  return () => { screenBackHandlers.delete(handler); };
}
// Platform adapters supply navigation and Android APIs; no duplicate React dependency.
export function installAndroidBack(ports: { subscribe: (handler: () => boolean) => { remove: () => void }; canGoBack: () => boolean; back: () => void; isHome: () => boolean; home: () => void; notify: () => void; exit: () => void; now?: () => number }) {
  let lastBack = 0;
  const now = ports.now ?? Date.now;
  const subscription = ports.subscribe(() => {
    for (const handler of [...screenBackHandlers].reverse()) { if (handler()) { lastBack = 0; return true; } }
    if (ports.canGoBack()) { lastBack = 0; ports.back(); return true; }
    if (!ports.isHome()) { lastBack = 0; ports.home(); return true; }
    const time = now();
    if (lastBack && time - lastBack < 2000) { lastBack = 0; ports.exit(); }
    else { lastBack = time; ports.notify(); }
    return true;
  });
  return () => subscription.remove();
}
export function mobileLogoSize(requested: number, width: number) {
  return width < 600 ? Math.min(requested, 56, width * 0.2) : requested;
}

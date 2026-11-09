import { SignIn } from '@clerk/react';
import BrandLogo from '../components/BrandLogo';
import { useShopUI } from '../components/ShopUI';

export function ShopLoginScreen() {
  const { C } = useShopUI();
  return <main aria-label="NearBy sign in" style={{ flex: 1, minWidth: 0, backgroundColor: C.bg, overflowY: 'auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
    <BrandLogo size={64} />
    <p style={{ color: C.cyan, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>NEARBY · SHOP PARTNER</p>
    <h1 style={{ color: C.text, fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.25, margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Welcome back.</h1>
    <SignIn routing="hash" forceRedirectUrl="/" fallback={<p style={{ color: C.muted }}>Loading Clerk sign-in…</p>} appearance={{ variables: {
      colorPrimary: C.blue, colorBackground: C.panel, colorForeground: C.text,
      colorMutedForeground: C.muted, borderRadius: '0.75rem',
    }, elements: {
      rootBox: { width: '100%', maxWidth: '420px', minWidth: 0 }, cardBox: { width: '100%', maxWidth: '100%', minWidth: 0 },
      card: { width: '100%', minWidth: 0, boxSizing: 'border-box' }, formFieldInput: { fontSize: '16px', backgroundColor: C.bg, color: C.text }, footerAction: { display: 'none' },
    } }} />
    <p style={{ color: C.muted, fontSize: 12, maxWidth: 420, textAlign: 'center', lineHeight: 1.6 }}>Sign in to continue to NearBy.</p>
  </main>;
}

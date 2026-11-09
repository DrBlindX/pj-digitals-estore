import { SignIn } from '@clerk/react';
import BrandLogo from '../components/BrandLogo';
import { C } from '../theme';
export default function DeliveryLoginScreen() {
 return <main style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 'clamp(24px, 6vh, 64px) 16px 32px', minHeight: 0, boxSizing: 'border-box', gap: 16, overflowY: 'auto' }}>
  <BrandLogo size={64} />
  <p style={{ color: C.primaryText, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>NEARBY · DELIVERY</p>
  <h1 style={{ color: C.text, fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.25, margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Welcome back.</h1>
  <SignIn routing="hash" forceRedirectUrl="/" appearance={{ variables: { colorPrimary: C.primary }, elements: { rootBox: { width: '100%', maxWidth: 420 }, card: { boxSizing: 'border-box', width: '100%', backgroundColor: C.surface, color: C.text }, formFieldInput: { backgroundColor: C.bg, color: C.text }, footerAction: { display: 'none' } } }} />
 </main>;
}

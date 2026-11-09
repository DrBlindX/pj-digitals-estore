import { SignIn } from '@clerk/react';
import BrandLogo from '../components/BrandLogo';
import { useAdminTheme } from '../context/AdminTheme';
export default function AdminLogin() {
 const { palette: p } = useAdminTheme();
 return <main style={{ flex: 1, background: p.background, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 16, overflowY: 'auto' }}>
  <BrandLogo size={64} />
  <p style={{ color: p.primaryText, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>NEARBY · ADMIN</p>
  <h1 style={{ color: p.text, fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.25, margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Welcome back.</h1>
  <SignIn routing="hash" forceRedirectUrl="/" appearance={{ variables: { colorPrimary: p.primary }, elements: { rootBox: { width: '100%', maxWidth: 420 }, card: { boxSizing: 'border-box', width: '100%', backgroundColor: p.surface, color: p.text }, formFieldInput: { backgroundColor: p.background, color: p.text }, footerAction: { display: 'none' } } }} />
  <p style={{ color: p.muted }}>Your account needs admin access to continue.</p>
 </main>;
}

import BrandLogo from '@/components/BrandLogo';
import { SignIn, SignUp } from '@clerk/react';
import { Link, useLocalSearchParams } from 'expo-router';
import { useStoreTheme } from '@/features/storefront/ThemeContext';

export default function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { palette } = useStoreTheme();
  const checkout = returnTo === 'payment';
  const destination = checkout ? '/?checkout=payment' : '/';
  const suffix = checkout ? '?returnTo=payment' : '';
  const appearance = {
    variables: { colorPrimary: palette.primary },
    elements: {
      rootBox: { width: '100%', maxWidth: 420 },
      card: { width: '100%', boxSizing: 'border-box' as const, backgroundColor: palette.surface, color: palette.text },
      formFieldInput: { backgroundColor: palette.background, color: palette.text },
      footerAction: { display: 'none' as const },
    },
  };
  const fallback = <div role="status" style={{ color: palette.muted, padding: 24, margin: 'auto', textAlign: 'center' }}>Loading secure sign-in…</div>;

  return <main aria-label={mode === 'login' ? 'Sign in' : 'Create account'} style={{
    flex: 1, width: '100%', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    overflowY: 'auto', boxSizing: 'border-box',
    padding: '32px 16px',
    backgroundColor: palette.background,
  }}>
    <BrandLogo size={64} />
    <p style={{ color: palette.primaryText, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>NEARBY · CUSTOMER</p>
    <h1 style={{ color: palette.text, fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.25, margin: 0, textAlign: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
    {mode === 'login'
      ? <SignIn routing="hash" appearance={appearance} fallback={fallback} signUpUrl={`/signup${suffix}`} forceRedirectUrl={destination} signUpForceRedirectUrl={destination} />
      : <SignUp routing="hash" appearance={appearance} fallback={fallback} signInUrl={`/login${suffix}`} forceRedirectUrl={destination} signInForceRedirectUrl={destination} />}
    <Link href={{ pathname: mode === 'login' ? '/signup' : '/login', params: checkout ? { returnTo: 'payment' } : {} }} style={{ color: palette.primaryText, fontSize: 13, padding: 8 }}>
      {mode === 'login' ? 'New to NearBy? Create an account' : 'Already have an account? Sign in'}
    </Link>
  </main>;
}

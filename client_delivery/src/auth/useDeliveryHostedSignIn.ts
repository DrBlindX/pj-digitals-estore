import { useClerk } from './clerkHooks';
import { withClerkResponseDiagnostics } from './clerkResponseDiagnostics';
import { useRef, useState } from 'react';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { makeRedirectUri } from 'expo-auth-session';

// Mounted by the auth provider, above navigation, throughout the browser round trip.
export function useDeliveryHostedSignIn() {
  const { startHostedAuth } = useHostedAuth();
  const clerk = useClerk();
  const [hostedSignIn, setHostedSignIn] = useState({ pending: false, error: '' });
  const lock = useRef(false);
  async function startHostedSignIn() {
    if (lock.current) return;
    lock.current = true; setHostedSignIn({ pending: true, error: '' });
    try {
      const start = () => startHostedAuth({ mode: 'sign-in', redirectUrl: makeRedirectUri({ path: 'hosted-auth-callback' }) });
      const result = await (__DEV__ ? withClerkResponseDiagnostics(clerk.frontendApi, start) : start());
      setHostedSignIn({ pending: false, error: result.createdSessionId ? '' : result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss' ? 'Sign-in cancelled. Please try again.' : 'Clerk could not finish sign-in. Please try again.' });
    } catch (cause) {
      setHostedSignIn({ pending: false, error: cause instanceof Error ? cause.message : 'Unable to open Clerk sign-in.' });
    } finally { lock.current = false; }
  }
  return { hostedSignIn, startHostedSignIn };
}

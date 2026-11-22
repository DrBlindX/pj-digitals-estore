import { Redirect } from 'expo-router';

// Clerk completes the browser handshake; the root auth gate keeps access protected.
export default function HostedAuthCallback() {
  return <Redirect href="/" />;
}

// The website renders Clerk SignIn directly and does not use native browser sessions.
export function useDeliveryHostedSignIn() {
  return { hostedSignIn: { pending: false, error: '' }, startHostedSignIn: async () => {} };
}

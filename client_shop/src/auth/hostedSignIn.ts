// Retry only a malformed sign-in initialization response, never credentials or API errors.
export function isMalformedAuthResponse(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return /json/i.test(message) && /parse|unexpected|invalid|syntax/i.test(message);
}

export async function startHostedSignIn<T>(start: () => Promise<T>): Promise<T> {
  try {
    return await start();
  } catch (error) {
    if (!isMalformedAuthResponse(error)) throw error;
    try {
      return await start();
    } catch (retryError) {
      if (!isMalformedAuthResponse(retryError)) throw retryError;
      throw new Error('Clerk returned an unreadable sign-in response. Try switching between Wi-Fi and mobile data, and temporarily disable any VPN or network filtering. Then try again.');
    }
  }
}

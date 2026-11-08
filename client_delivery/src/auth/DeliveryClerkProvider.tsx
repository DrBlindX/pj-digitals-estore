import type { PropsWithChildren } from 'react';
import Constants from 'expo-constants';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

export default function DeliveryClerkProvider({ children, publishableKey }: PropsWithChildren<{ publishableKey: string }>) {
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_disableNativeClientSync={Constants.executionEnvironment === 'storeClient'}>{children}</ClerkProvider>;
}

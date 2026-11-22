import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import HostedLogin from './DeliveryLoginScreenHosted';

// Expo Go cannot load the native Clerk module. Installed Android apps use
// the same native authentication UI as the customer app.
const NativeAuthView: typeof import('@clerk/expo/native-components').AuthView | null =
  Constants.executionEnvironment === 'storeClient' ? null : require('@clerk/expo/native-components').AuthView;

export default function DeliveryLoginScreen() {
  if (!NativeAuthView) return <HostedLogin />;
  return <><StatusBar style="auto" /><NativeAuthView mode="signIn" isDismissible={false} /></>;
}

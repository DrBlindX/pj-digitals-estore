import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import HostedSettings from './AccountSettingsHosted';
const NativeProfile = Constants.executionEnvironment === 'storeClient' ? null : require('@clerk/expo/native-components').UserProfileView;
export default function AccountSettings() {
  if (!NativeProfile) return <HostedSettings />;
  return <View style={{ flex: 1 }}><NativeProfile isDismissible={false} onHostBack={() => router.canGoBack() ? router.back() : router.replace('/')} /></View>;
}

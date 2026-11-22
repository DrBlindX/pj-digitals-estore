import { useEffect } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { router, usePathname } from 'expo-router';
import { installAndroidBack } from '../../../shared/mobile';
export default function MobileNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    return installAndroidBack({
      subscribe: handler => BackHandler.addEventListener('hardwareBackPress', handler),
      canGoBack: () => router.canGoBack(), back: () => router.back(),
      isHome: () => pathname === '/' || pathname === '/index', home: () => router.replace('/'),
      notify: () => ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT), exit: () => BackHandler.exitApp(),
    });
  }, [pathname]);
  return null;
}

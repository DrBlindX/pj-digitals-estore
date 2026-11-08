import ShopClerkProvider from '../auth/ShopClerkProvider';
import LowStockNotice from '../components/LowStockNotice';
import BrandLogo from '../components/BrandLogo';
import { ShopThemeProvider, type ShopColors } from '../context/ShopThemeContext';
import { useShopUI } from '../components/ShopUI';
import { Tabs, usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PartnerLoadingScreen } from '../components/PartnerLoadingScreen';
import { ShopDataProvider } from '../context/ShopDataContext';
import { ShopAuthProvider, useShopAuth } from '../context/ShopAuthContext';
import { ShopLoginScreen } from '../screens/ShopLoginScreen';
import { ServerConnection } from '../components/ServerConnection';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const tabs: { route: string; title: string; icon: IconName }[] = [
  { route: 'index', title: 'Home', icon: 'view-dashboard-outline' },
  { route: 'insights', title: 'Insights', icon: 'chart-box-outline' },
  { route: 'orders', title: 'Orders', icon: 'receipt-text-outline' },
  { route: 'deliveries', title: 'Deliveries', icon: 'truck-delivery-outline' },
  { route: 'products', title: 'Products', icon: 'tag-multiple-outline' },
  { route: 'inventory', title: 'Stock status', icon: 'cube-outline' },
  { route: 'store', title: 'Profile', icon: 'storefront-outline' },
];

export default function ShopLayout() {
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => setLoading(false), []);
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) throw new Error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in client_shop/.env.local and restart Expo.');
  return <ShopThemeProvider><ShopClerkProvider publishableKey={publishableKey}><ShopAuthProvider><View style={{ flex: 1 }}>
    <View style={{ flex: 1 }} pointerEvents={loading ? 'none' : 'auto'} accessibilityElementsHidden={loading} importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}><ServerConnection><ShopNavigation /></ServerConnection></View>
    {loading ? <PartnerLoadingScreen onFinish={finishLoading} /> : null}
  </View></ShopAuthProvider></ShopClerkProvider></ShopThemeProvider>;
}

function ShopNavigation() {
  const { C } = useShopUI();
  const menuStyles = createMenuStyles(C);
  const { account, ready, logout } = useShopAuth();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.muted }}>Loading your account…</Text></View>;
  if (!account) return <ShopLoginScreen />;
  return <ShopDataProvider key={account.id}><Tabs backBehavior="history" screenOptions={{ headerShown: true, tabBarStyle: { display: 'none' }, header: () => <SafeAreaView edges={['top', 'left', 'right']} style={menuStyles.topBar}>
    <View style={menuStyles.topContent}>
      <BrandLogo size={40} />
      <View style={{ flex: 1, minWidth: 0 }}><Text style={menuStyles.eyebrow} numberOfLines={1}>NEARBY · SHOP PARTNER</Text><Text style={menuStyles.topShop} numberOfLines={1}>{account.shopName}</Text></View>
      <Pressable accessibilityLabel="Open navigation menu" accessibilityRole="button" onPress={() => setMenuOpen(true)} style={menuStyles.menuButton}><MaterialCommunityIcons name="menu" size={25} color={C.cyan} /></Pressable>
    </View>
  </SafeAreaView> }}>
    {tabs.map(({ route, title, icon }) => <Tabs.Screen key={route} name={route} options={{ title, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icon} color={color} size={size} /> }} />)}
  </Tabs><RightMenu open={menuOpen} close={() => setMenuOpen(false)} shopName={account.shopName} active={pathname.split('/').pop() || 'index'} navigate={(route) => { setMenuOpen(false); router.navigate((route === 'index' ? '/' : `/${route}`) as Href); }} logoutError={logoutError} signingOut={signingOut} logout={() => { if (signingOut) return; setSigningOut(true); setLogoutError(''); void logout().then(() => setMenuOpen(false)).catch(() => setLogoutError('Unable to sign out. Please try again.')).finally(() => setSigningOut(false)); }} /><LowStockNotice /></ShopDataProvider>;
}

function RightMenu({ open, close, shopName, active, navigate, logout, logoutError, signingOut }: { open: boolean; close: () => void; shopName: string; active: string; navigate: (route: string) => void; logout: () => void; logoutError: string; signingOut: boolean }) {
  const { C, mode, setMode } = useShopUI();
  const menuStyles = createMenuStyles(C);
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(350, width * 0.88);
  const [slide] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!open) { slide.setValue(1); return; }
    const animation = Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [open, slide]);
  return <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
    <View style={menuStyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close navigation menu" accessibilityRole="button" />
      <Animated.View style={[menuStyles.panel, { width: panelWidth, transform: [{ translateX: Animated.multiply(slide, panelWidth) }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={menuStyles.heading}><View style={{ marginRight: 12 }}><BrandLogo size={42} /></View><View style={{ flex: 1 }}><Text style={menuStyles.eyebrow}>NEARBY · SHOP PARTNER</Text><Text style={menuStyles.shop}>{shopName}</Text></View><Pressable accessibilityLabel="Close menu" accessibilityRole="button" onPress={close} style={{ padding: 10 }}><MaterialCommunityIcons name="close" size={24} color={C.text} /></Pressable></View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {tabs.map(tab => <Pressable key={tab.route} accessibilityRole="button" accessibilityState={{ selected: active === tab.route }} onPress={() => navigate(tab.route)} style={[menuStyles.item, active === tab.route && menuStyles.selected]}>
              <MaterialCommunityIcons name={tab.icon} size={22} color={active === tab.route ? C.onPrimary : C.cyan} />
              <Text style={[menuStyles.label, active === tab.route && { color: C.onPrimary }]}>{tab.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={active === tab.route ? C.onPrimary : C.amber} />
            </Pressable>)}
          </ScrollView>
          <View style={menuStyles.footer}><Pressable accessibilityRole="switch" accessibilityLabel="Dark mode" accessibilityState={{ checked: mode === 'dark' }} onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')} style={menuStyles.item}><MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'white-balance-sunny'} color={C.cyan} size={22} /><Text style={menuStyles.label}>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</Text><Text style={{ color: C.cyan }}>Switch</Text></Pressable><Pressable accessibilityRole="button" onPress={logout} disabled={signingOut} accessibilityState={{ disabled: signingOut, busy: signingOut }} style={menuStyles.item}><MaterialCommunityIcons name="logout" color={C.red} size={22} /><Text style={[menuStyles.label, { color: C.red }]}>{signingOut ? 'Signing out…' : 'Log out'}</Text></Pressable><Text accessibilityRole="alert" style={{ color: C.red, fontSize: 12 }}>{logoutError}</Text><Text style={menuStyles.location}>LOCAL ROOTS. NEW POSSIBILITIES.</Text></View>
        </SafeAreaView>
      </Animated.View>
    </View>
  </Modal>;
}

const createMenuStyles = (C: ShopColors) => StyleSheet.create({
  topBar: { backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.line },
  topContent: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 72 },
  logo: { width: 40, height: 40, borderRadius: 11, backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: C.cyan, fontWeight: '800', fontSize: 22 },
  topShop: { color: C.text, fontSize: 14, fontWeight: '600', marginTop: 5 },
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: C.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(35,28,54,0.4)', alignItems: 'flex-end' },
  panel: { height: '100%', backgroundColor: C.panel, borderLeftWidth: 3, borderLeftColor: C.line },
  heading: { flexDirection: 'row', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: C.line },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, color: C.amber, fontWeight: '800' },
  shop: { color: C.text, fontSize: 20, fontWeight: '700', marginTop: 9 },
  item: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  selected: { backgroundColor: C.blue },
  label: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: C.line },
  location: { color: C.muted, fontSize: 9, letterSpacing: 1, textAlign: 'center', marginTop: 15, marginBottom: 10 },
});

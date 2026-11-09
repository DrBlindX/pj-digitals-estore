import { useClerk } from '../auth/clerkHooks';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from './BrandLogo';
import { useAdminTheme } from '../context/AdminTheme';

export default function AdminMenu({ open, onClose, items, active, onSelect }: { open: boolean; onClose: () => void; items: string[]; active: string; onSelect: (item: string) => void }) {
  const clerk = useClerk();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const { palette: p, mode, toggle } = useAdminTheme();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(350, width * 0.88);
  const [slide] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!open) { slide.setValue(1); return; }
    const animation = Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [open, slide]);
  return <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, alignItems: 'flex-end', backgroundColor: 'rgba(35,28,54,0.35)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View accessibilityViewIsModal style={{ width: panelWidth, height: '100%', backgroundColor: p.glass, borderLeftWidth: 1, borderColor: p.border, transform: [{ translateX: Animated.multiply(slide, panelWidth) }] }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderColor: p.border }}>
            <BrandLogo size={42} /><Text style={{ flex: 1, color: p.text, fontSize: 18, fontWeight: '800' }}>NearBy Admin</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{ padding: 10 }}><Text style={{ color: p.text, fontSize: 24 }}>×</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {items.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: active === item }} onPress={() => { onSelect(item); onClose(); }} style={{ minHeight: 48, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: active === item ? p.primary : 'transparent' }}>
              <Text style={{ flex: 1, color: active === item ? p.onPrimary : p.text, fontSize: 14, fontWeight: '700' }}>{item}</Text><Text style={{ color: active === item ? p.onPrimary : p.primaryText }}>›</Text>
            </Pressable>)}
          </ScrollView>
          <Pressable accessibilityRole="switch" accessibilityLabel="Dark mode" accessibilityState={{ checked: mode === 'dark' }} onPress={toggle} style={{ margin: 16, padding: 16, minHeight: 48, borderRadius: 12, backgroundColor: p.soft }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>{mode === 'dark' ? '☀ Switch to light mode' : '☾ Switch to dark mode'}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={signingOut} onPress={() => { if (signingOut) return; setSigningOut(true); setLogoutError(''); void clerk.signOut().then(onClose).catch(() => setLogoutError('Unable to sign out. Please try again.')).finally(() => setSigningOut(false)); }} style={{ padding: 16, marginHorizontal: 16 }}><Text style={{ color: p.terracotta, fontWeight: '700' }}>{signingOut ? 'Signing out…' : 'Sign out'}</Text></Pressable>
          {logoutError ? <Text accessibilityRole="alert" style={{ color: p.terracotta, paddingHorizontal: 16 }}>{logoutError}</Text> : null}
        </SafeAreaView>
      </Animated.View>
    </View>
  </Modal>;
}

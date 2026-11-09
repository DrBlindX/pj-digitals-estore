import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToast, type ToastMessage } from '../lib/toast';
import { useAdminTheme } from '../context/AdminTheme';
export default function AdminToast() {
 const { palette: p } = useAdminTheme();
 const insets = useSafeAreaInsets();
 const [message, setMessage] = useState<ToastMessage | null>(null);
 useEffect(() => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = subscribeToast(next => { if (timer) clearTimeout(timer); setMessage(next); timer = setTimeout(() => setMessage(null), next.type === 'error' ? 6000 : 3500); });
  return () => { unsubscribe(); if (timer) clearTimeout(timer); };
 }, []);
 if (!message) return null;
 return <View pointerEvents="box-none" style={{ position: 'absolute', bottom: insets.bottom + 20, left: 16, right: 16, alignItems: 'center', zIndex: 1000 }}>
  <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', backgroundColor: p.surface, borderWidth: 1, borderColor: message.type === 'error' ? p.terracotta : p.primaryText, borderRadius: 14, paddingLeft: 16, paddingVertical: 8, shadowColor: '#302843', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}>
   <Text style={{ color: message.type === 'error' ? p.terracotta : p.primaryText, fontSize: 20, marginRight: 12 }}>{message.type === 'error' ? '!' : '✓'}</Text><Text style={{ color: p.text, flex: 1, lineHeight: 20 }}>{message.text}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => setMessage(null)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: p.muted, fontSize: 22 }}>×</Text></Pressable>
  </View>
 </View>;
}

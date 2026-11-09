import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAdminTheme } from '../context/AdminTheme';
import AdminDeliveries from './AdminDeliveries';
import AdminPartners from './AdminPartners';
export default function AdminDeliveryScreen() {
 const { palette: p } = useAdminTheme();
 const [tab, setTab] = useState<'Assignments' | 'Partners'>('Assignments');
 return <View style={{ gap: 16 }}>
  <Text style={{ color: p.text, fontSize: 24, fontWeight: '800' }}>Delivery</Text>
  <View style={{ flexDirection: 'row', gap: 8 }}>{(['Assignments','Partners'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: tab === value ? p.primary : p.soft }}><Text style={{ color: tab === value ? p.onPrimary : p.primaryText, fontWeight: '700' }}>{value}</Text></Pressable>)}</View>
  {tab === 'Assignments' ? <AdminDeliveries /> : <AdminPartners />}
 </View>;
}

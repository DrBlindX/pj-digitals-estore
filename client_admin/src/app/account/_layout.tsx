import { Slot, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountSettings from '../../auth/AccountSettings';
import { useAdminTheme } from '../../context/AdminTheme';
// Keep UserProfile mounted while Clerk navigates between Profile and Security.
export default function AccountLayout() {
 const { palette: p } = useAdminTheme();
 const router = useRouter();
 return <SafeAreaView style={{ flex: 1, backgroundColor: p.background }}><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 16 }}>
  <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={{ paddingVertical: 12 }}><Text style={{ color: p.primaryText, fontWeight: '700' }}>← Back to admin</Text></Pressable>
  <View><Text style={{ color: p.text, fontSize: 24, fontWeight: '800' }}>Account settings</Text><Text style={{ color: p.muted, marginTop: 6 }}>Your Clerk profile and sign-in security.</Text></View>
  <AccountSettings /><Slot />
 </ScrollView></SafeAreaView>;
}

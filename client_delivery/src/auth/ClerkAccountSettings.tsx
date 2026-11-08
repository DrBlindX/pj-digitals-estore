import { Text, View } from 'react-native';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';
import { C } from '../theme';

export default function ClerkAccountSettings() {
  const { partner } = useDeliveryAuth();
  return <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, gap: 8 }}>
    <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{partner?.name || 'Delivery partner'}</Text>
    <Text style={{ color: C.muted }}>{partner?.email || 'No email available'}</Text>
    <Text style={{ color: C.muted, lineHeight: 20 }}>Full Clerk profile and security settings require a native development build. Use the web app to manage your Clerk account.</Text>
  </View>;
}

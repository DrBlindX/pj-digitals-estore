import DeliveryLoginScreen from '../screens/DeliveryLoginScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import { useDeliveryAuth } from '../context/DeliveryAuthContext';

export default function IndexScreen() {
  const { partner } = useDeliveryAuth();
  return partner ? <DeliveryScreen /> : <DeliveryLoginScreen />;
}

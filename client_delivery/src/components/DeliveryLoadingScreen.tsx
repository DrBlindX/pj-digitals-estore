import OpeningScreen from './OpeningScreen';
import { C } from '../theme';
export function DeliveryLoadingScreen({ onFinish }: { onFinish: () => void }) {
 return <OpeningScreen onFinish={onFinish} role="Delivery partner" colors={{ ...C, background: C.bg }} />;
}

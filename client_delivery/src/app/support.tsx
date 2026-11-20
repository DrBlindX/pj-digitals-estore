import SupportScreen from '../components/SupportScreen';
import { useLocalSearchParams } from 'expo-router';
import { lightColors, darkColors } from '../theme';
export default function SupportRoute() { const { mode } = useLocalSearchParams<{ mode?: string }>(); const C = mode === 'dark' ? darkColors : lightColors; return <SupportScreen app="Delivery" colors={{ ...C, background: C.bg, error: C.red }} />; }

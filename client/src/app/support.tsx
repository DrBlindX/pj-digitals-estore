import SupportScreen from '../components/SupportScreen';
import { useStoreTheme } from '../features/storefront/ThemeContext';
export default function SupportRoute() { const { palette: p } = useStoreTheme(); return <SupportScreen app="Customer" colors={{ ...p, error: '#B42335' }} />; }

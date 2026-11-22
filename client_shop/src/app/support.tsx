import SupportScreen from '../components/SupportScreen';
import { useShopUI } from '../components/ShopUI';
export default function SupportRoute() { const { C } = useShopUI(); return <SupportScreen app="Shop" colors={{ ...C, background: C.bg, surface: C.panel, border: C.line, primary: C.blue, error: C.red }} />; }

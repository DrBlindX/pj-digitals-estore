import OpeningScreen from './OpeningScreen';
import { useShopTheme } from '../context/ShopThemeContext';
export function PartnerLoadingScreen({ onFinish }: { onFinish: () => void }) {
 const { C } = useShopTheme();
 return <OpeningScreen onFinish={onFinish} role="Shop partner" colors={{ background: C.bg, surface: C.panel, text: C.text, muted: C.muted, border: C.line, primaryText: C.cyan, soft: C.soft }} />;
}

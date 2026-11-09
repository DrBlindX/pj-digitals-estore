import OpeningScreen from './OpeningScreen';
import { useAdminTheme } from '../context/AdminTheme';
export function AdminLoadingScreen({ onFinish }: { onFinish: () => void }) {
 const { palette } = useAdminTheme();
 return <OpeningScreen onFinish={onFinish} role="Administration" colors={palette} />;
}

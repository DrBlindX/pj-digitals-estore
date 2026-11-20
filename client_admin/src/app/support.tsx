import SupportScreen from '../components/SupportScreen';
import { useAdminTheme } from '../context/AdminTheme';
export default function SupportRoute() { const { palette: p } = useAdminTheme(); return <SupportScreen app="Admin" colors={{ ...p, error: p.terracotta }} />; }

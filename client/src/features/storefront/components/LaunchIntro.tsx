import { useCallback, useState } from 'react';
import { Animated } from 'react-native';
import OpeningScreen from '../../../components/OpeningScreen';
import { useStoreTheme } from '../ThemeContext';
export default function LaunchIntro({ transition }: { transition: Animated.Value }) {
 const { palette } = useStoreTheme();
 const [visible, setVisible] = useState(true);
 const finish = useCallback(() => { transition.setValue(1); setVisible(false); }, [transition]);
 return visible ? <OpeningScreen onFinish={finish} role="Your local marketplace" colors={palette} /> : null;
}

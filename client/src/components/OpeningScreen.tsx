import { openingScreen as theme } from '../../../shared/theme';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import BrandLogo from './BrandLogo';
type Colors = { background: string; surface: string; text: string; muted: string; border: string; primaryText: string; soft: string };
export default function OpeningScreen({ onFinish, colors: p, role }: { onFinish: () => void; colors: Colors; role: string }) {
 const [entrance] = useState(() => new Animated.Value(0));
 const [progress] = useState(() => new Animated.Value(0));
 const [fade] = useState(() => new Animated.Value(1));
 useEffect(() => {
  let active = true;
  let animation: Animated.CompositeAnimation | undefined;
  void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
   if (!active) return;
   if (reduced) { onFinish(); return; }
   animation = Animated.parallel([
    Animated.timing(entrance, { toValue: 1, duration: theme.entranceMs, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }),
    Animated.sequence([
     Animated.timing(progress, { toValue: 1, duration: theme.progressMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
     Animated.timing(fade, { toValue: 0, duration: theme.fadeMs, useNativeDriver: true, isInteraction: false }),
    ]),
   ]);
   animation.start(({ finished }) => { if (active && finished) onFinish(); });
  }).catch(() => { if (active) onFinish(); });
  return () => { active = false; animation?.stop(); };
 }, [entrance, progress, fade, onFinish]);
 return <Animated.View accessibilityViewIsModal accessibilityLabel={`Opening NearBy ${role}`} style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: p.background, alignItems: 'center', justifyContent: 'center', opacity: fade, padding: theme.padding }]}>
  <Animated.View style={{ width: '100%', maxWidth: theme.maxWidth, alignItems: 'center', opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
   <View style={{ padding: theme.logoPadding, borderRadius: theme.logoRadius, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, marginBottom: 24 }}><BrandLogo size={theme.logoSize} /></View>
   <Text style={{ color: p.text, fontSize: theme.titleSize, fontWeight: '700', letterSpacing: -0.8 }}>NearBy</Text>
   <Text style={{ color: p.muted, fontSize: theme.roleSize, letterSpacing: 2, fontWeight: '600', marginTop: 10, textTransform: 'uppercase' }}>{role}</Text>
   <View accessible accessibilityRole="progressbar" accessibilityLabel={`Opening ${role}`} style={{ width: theme.progressWidth, height: theme.progressHeight, overflow: 'hidden', backgroundColor: p.soft, borderRadius: 3, marginTop: 36 }}><Animated.View style={{ width: theme.progressWidth, height: theme.progressHeight, backgroundColor: p.primaryText, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-theme.progressWidth, 0] }) }] }} /></View>
   <Text style={{ color: p.muted, fontSize: theme.captionSize, marginTop: 16 }}>A little closer to everything.</Text>
  </Animated.View>
 </Animated.View>;
}

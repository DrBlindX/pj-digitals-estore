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
    Animated.timing(entrance, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }),
    Animated.sequence([
     Animated.timing(progress, { toValue: 1, duration: 3550, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
     Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true, isInteraction: false }),
    ]),
   ]);
   animation.start(({ finished }) => { if (active && finished) onFinish(); });
  }).catch(() => { if (active) onFinish(); });
  return () => { active = false; animation?.stop(); };
 }, [entrance, progress, fade, onFinish]);
 return <Animated.View accessibilityViewIsModal accessibilityLabel={`Opening NearBy ${role}`} style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: p.background, alignItems: 'center', justifyContent: 'center', opacity: fade, padding: 24 }]}>
  <Animated.View style={{ width: '100%', maxWidth: 340, alignItems: 'center', opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
   <View style={{ padding: 20, borderRadius: 24, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, marginBottom: 24 }}><BrandLogo size={72} /></View>
   <Text style={{ color: p.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.8 }}>NearBy</Text>
   <Text style={{ color: p.muted, fontSize: 11, letterSpacing: 2, fontWeight: '600', marginTop: 10, textTransform: 'uppercase' }}>{role}</Text>
   <View accessible accessibilityRole="progressbar" accessibilityLabel={`Opening ${role}`} style={{ width: 160, height: 3, overflow: 'hidden', backgroundColor: p.soft, borderRadius: 3, marginTop: 36 }}><Animated.View style={{ width: 160, height: 3, backgroundColor: p.primaryText, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }) }] }} /></View>
   <Text style={{ color: p.muted, fontSize: 12, marginTop: 16 }}>A little closer to everything.</Text>
  </Animated.View>
 </Animated.View>;
}

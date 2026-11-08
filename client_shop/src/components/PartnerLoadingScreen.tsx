import BrandLogo from './BrandLogo';
import { useShopTheme, type ShopColors } from '../context/ShopThemeContext';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export function PartnerLoadingScreen({ onFinish }: { onFinish: () => void }) {
  const { C } = useShopTheme();
  const s = createLoadingStyles(C);
  const { height } = useWindowDimensions();
  const compact = height < 620;
  const [entrance] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      if (reduced) { onFinish(); return; }
      animation = Animated.parallel([
        Animated.timing(entrance, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false }),
        Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 3550, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
        Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true, isInteraction: false }),
        ]),
      ]);
      animation.start(({ finished }) => { if (active && finished) onFinish(); });
    }).catch(() => { if (active) onFinish(); });
    return () => { active = false; animation?.stop(); };
  }, [entrance, fade, onFinish, progress]);
  return <Animated.View style={[s.screen, { opacity: fade }]} accessibilityViewIsModal>
    <View style={[s.trim, { top: 20 }]} />
    <View style={s.circle} />
    <Animated.View style={[s.brand, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <View style={[s.mark, compact && { width: 64, height: 64, marginBottom: 14 }]}><BrandLogo size={compact ? 48 : 68} /></View>
      <Text style={[s.title, compact && { fontSize: 30 }]}>NearBy</Text>
      <Text style={s.partner}>PARTNER</Text>
      <View style={[s.divider, compact && { marginVertical: 14 }]} />
      <Text style={s.tagline}>Local roots. New possibilities.</Text>
      <Text style={s.subtitle}>Your shop, ready for the neighbourhood.</Text>
    </Animated.View>
    <View style={[s.footer, compact && { bottom: 38 }]}>
      <Text style={s.label}>OPENING YOUR PARTNER PORTAL</Text>
      <View style={s.track} accessible accessibilityRole="progressbar" accessibilityLabel="Loading partner portal">
        <Animated.View style={[s.fill, { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-220, 0] }) }] }]} />
      </View>
      <Text style={s.location}>THODUPUZHA · MUTTOM · KERALA</Text>
    </View>
    <View style={[s.trim, { bottom: 20 }]} />
  </Animated.View>;
}

const createLoadingStyles = (C: ShopColors) => StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  trim: { position: 'absolute', left: 20, right: 20, height: 5, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  circle: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 1, borderColor: C.line },
  brand: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 60 },
  mark: { width: 88, height: 88, borderRadius: 24, backgroundColor: C.soft, borderWidth: 3, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginBottom: 23 },
  monogram: { color: C.cyan, fontSize: 25, fontWeight: '800', letterSpacing: 1 },
  title: { color: C.text, fontFamily: 'serif', fontSize: 38 },
  partner: { color: C.amber, fontSize: 11, fontWeight: '700', letterSpacing: 5, marginTop: 10 },
  divider: { height: 1, width: 42, backgroundColor: C.line, marginVertical: 25 },
  tagline: { color: C.text, fontSize: 16, textAlign: 'center' },
  subtitle: { color: C.muted, fontSize: 12, marginTop: 10, textAlign: 'center', lineHeight: 18 },
  footer: { position: 'absolute', bottom: '10%', alignItems: 'center' },
  label: { color: C.amber, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 15 },
  track: { width: 220, height: 3, backgroundColor: C.tint, borderRadius: 3, overflow: 'hidden' },
  fill: { width: 220, height: 3, backgroundColor: C.amber },
  location: { color: C.muted, fontSize: 8, letterSpacing: 1.5, marginTop: 20 },
});

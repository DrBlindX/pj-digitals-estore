import { palettes, type Palette } from './palettes';
import { bannerColors } from './tokens';

export function shopColors(p: Palette) {
  return { bg: p.background, panel: p.surface, raised: p.soft, soft: p.soft, tint: p.tint,
    line: p.border, text: p.text, muted: p.muted, blue: p.primary, cyan: p.primaryText,
    green: p.primaryText, amber: p.gold, red: p.terracotta, onPrimary: p.onPrimary,
    glass: p.glass, gradient: p.gradient, bannerText: bannerColors.text, bannerMuted: bannerColors.muted,
    bannerAccent: bannerColors.accent, dangerSoft: p.soft };
}
export const shopPalettes = { light: shopColors(palettes.light), dark: shopColors(palettes.dark) };
export type ShopColors = ReturnType<typeof shopColors>;

export function deliveryColors(p: Palette) {
  const { background, terracotta, ...colors } = p;
  return { ...colors, bg: background, red: terracotta };
}
export const deliveryPalettes = { light: deliveryColors(palettes.light), dark: deliveryColors(palettes.dark) };

// Compatibility colors for the customer's secondary/template screens.
export const templateColors = {
  light: { text: palettes.light.text, background: palettes.light.background, backgroundElement: '#F0F0F3', backgroundSelected: '#E0E1E6', textSecondary: palettes.light.muted },
  dark: { text: '#ffffff', background: palettes.dark.background, backgroundElement: palettes.dark.surface, backgroundSelected: '#2E3135', textSecondary: '#B0B4BA' },
};

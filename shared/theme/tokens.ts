import { palettes } from './palettes';

// Common typography and spacing. These values do not depend on React Native.
export const fonts = {
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
};

export const spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;

export const openingScreen = {
  entranceMs: 450, progressMs: 3550, fadeMs: 450,
  padding: 24, maxWidth: 340, logoSize: 72, logoPadding: 20, logoRadius: 24,
  titleSize: 30, roleSize: 11, captionSize: 12,
  progressWidth: 160, progressHeight: 3,
} as const;

// Banners use a pale gradient in both modes, so their text stays dark.
export const bannerColors = { text: palettes.light.text, muted: '#596A80', accent: palettes.light.primaryText, button: palettes.light.primary, onButton: palettes.light.onPrimary, border: '#D3CBE4' };

export const promotionColors = [
  { colors: ['#EDF2F7', '#DFE7F0', '#D9D8E6'], ink: palettes.light.text, accent: palettes.light.primary },
  { colors: ['#F0EDF4', '#E5E2ED', '#DCD8E7'], ink: palettes.light.text, accent: palettes.light.gold },
  { colors: ['#EAF0F3', '#DEE8F2', '#DADDE9'], ink: '#2C3455', accent: palettes.light.primaryText },
  { colors: ['#EDF1F6', '#E4E2EC', '#DFE7F0'], ink: palettes.light.text, accent: palettes.light.primaryText },
] as const;

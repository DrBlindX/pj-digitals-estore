import { createContext, useContext, useState, type PropsWithChildren } from 'react';

// Match the customer app palette; keep this app independently buildable.
export type Palette = {
  background: string; surface: string; text: string; muted: string; primary: string;
  primaryText: string; soft: string; tint: string; heroAccent: string; border: string;
  strong: string; glass: string; gold: string; terracotta: string; onPrimary: string; gradient: [string, string, string, string, string, string, string];
};

const palettes: { light: Palette; dark: Palette } = {
  dark: {
    background: '#283342', surface: '#344154', text: '#F3F6FB', muted: '#C5CFDD',
    primary: '#49648B', primaryText: '#C1D3EC', soft: '#3D4C61', tint: '#4A4863',
    heroAccent: 'rgba(181,176,207,0.14)', border: '#5B6B81', strong: '#36465D',
    glass: '#344154', gold: '#CFBFDF', terracotta: '#FFB6C1', onPrimary: '#FFFFFF', gradient: ['#F4F6FA', '#EEF2F7', '#E9EDF4', '#E4E9F1', '#E0E5EE', '#DCDDEA', '#D8D6E5'],
  },
  light: {
    background: '#F5F7FA', surface: '#FFFFFF', text: '#1F2D40', muted: '#66758A',
    primary: '#263D5C', primaryText: '#334E73', soft: '#EAF0F6', tint: '#E7E3EF',
    heroAccent: 'rgba(119,105,142,0.12)', border: '#D6DFE9', strong: '#192F4D',
    glass: 'rgba(250,252,255,0.97)', gold: '#756588', terracotta: '#AB4559', onPrimary: '#FFFFFF', gradient: ['#F4F6FA', '#EEF2F7', '#E9EDF4', '#E4E9F1', '#E0E5EE', '#DCDDEA', '#D8D6E5'],
  },
};

export type ShopColors = ReturnType<typeof shopColors>;
function shopColors(p: Palette) {
  return { bg: p.background, panel: p.surface, raised: p.soft, soft: p.soft, tint: p.tint,
    line: p.border, text: p.text, muted: p.muted, blue: p.primary, cyan: p.primaryText,
    green: p.primaryText, amber: p.gold, red: p.terracotta, onPrimary: p.onPrimary,
    glass: p.glass, gradient: p.gradient, bannerText: '#1F2D40', bannerMuted: '#596A80',
    bannerAccent: '#334E73', dangerSoft: p.soft };
}
const colors = { light: shopColors(palettes.light), dark: shopColors(palettes.dark) };
type Mode = 'light' | 'dark';
const Context = createContext<{ C: ShopColors; mode: Mode; setMode: (mode: Mode) => void }>({ C: colors.light, mode: 'light', setMode: () => {} });
export function ShopThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>('light');
  return <Context.Provider value={{ C: colors[mode], mode, setMode }}>{children}</Context.Provider>;
}
export const useShopTheme = () => useContext(Context);

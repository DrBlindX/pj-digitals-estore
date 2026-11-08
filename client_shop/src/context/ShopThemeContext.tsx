import { createContext, useContext, useState, type PropsWithChildren } from 'react';

// Match the customer app palette; keep this app independently buildable.
export type Palette = {
  background: string; surface: string; text: string; muted: string; primary: string;
  primaryText: string; soft: string; tint: string; heroAccent: string; border: string;
  strong: string; glass: string; gold: string; terracotta: string; onPrimary: string; gradient: [string, string, string, string, string, string, string];
};

const palettes: { light: Palette; dark: Palette } = {
  dark: {
    background: '#343248', surface: '#423E58', text: '#F6F3FF', muted: '#D5CEE6',
    primary: '#695094', primaryText: '#E1D5FF', soft: '#4B4563', tint: '#554E70',
    heroAccent: 'rgba(181,159,230,0.20)', border: '#7B6E97', strong: '#434764',
    glass: '#423E58', gold: '#D3C2F9', terracotta: '#FFB3B9', onPrimary: '#FFFFFF', gradient: ['#F1EBFA', '#E9E2F6', '#E0DAF1', '#D7D3ED', '#CDCBE8', '#C3C1E2', '#BCB3DC'],
  },
  light: {
    background: '#F8F7FC', surface: '#FFFFFF', text: '#302843', muted: '#716781',
    primary: '#4B3575', primaryText: '#4B3575', soft: '#F0EDF8', tint: '#E7DFF4',
    heroAccent: 'rgba(170,150,211,0.20)', border: '#D8D0E7', strong: '#293653',
    glass: 'rgba(250,248,255,0.97)', gold: '#7756A7', terracotta: '#B34660', onPrimary: '#FFFFFF', gradient: ['#F1EBFA', '#E9E2F6', '#E0DAF1', '#D7D3ED', '#CDCBE8', '#C3C1E2', '#BCB3DC'],
  },
};

export type ShopColors = ReturnType<typeof shopColors>;
function shopColors(p: Palette) {
  return { bg: p.background, panel: p.surface, raised: p.soft, soft: p.soft, tint: p.tint,
    line: p.border, text: p.text, muted: p.muted, blue: p.primary, cyan: p.primaryText,
    green: p.primaryText, amber: p.gold, red: p.terracotta, onPrimary: p.onPrimary,
    glass: p.glass, gradient: p.gradient, bannerText: '#302843', bannerMuted: '#625477',
    bannerAccent: '#4B3575', dangerSoft: p.soft };
}
const colors = { light: shopColors(palettes.light), dark: shopColors(palettes.dark) };
type Mode = 'light' | 'dark';
const Context = createContext<{ C: ShopColors; mode: Mode; setMode: (mode: Mode) => void }>({ C: colors.light, mode: 'light', setMode: () => {} });
export function ShopThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>('light');
  return <Context.Provider value={{ C: colors[mode], mode, setMode }}>{children}</Context.Provider>;
}
export const useShopTheme = () => useContext(Context);

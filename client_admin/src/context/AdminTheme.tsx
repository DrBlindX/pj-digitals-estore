import { createContext, useContext, useState, type PropsWithChildren } from 'react';
export type Palette = {
  background: string; surface: string; text: string; muted: string; primary: string;
  primaryText: string; soft: string; tint: string; heroAccent: string; border: string;
  strong: string; glass: string; gold: string; terracotta: string; onPrimary: string; gradient: [string, string, string, string, string, string, string];
};

export const palettes: { light: Palette; dark: Palette } = {
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


type Mode = 'light' | 'dark';
const Context = createContext<{ mode: Mode; palette: Palette; toggle: () => void }>({ mode: 'light', palette: palettes.light, toggle: () => {} });
export function AdminThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>('light');
  return <Context.Provider value={{ mode, palette: palettes[mode], toggle: () => setMode(value => value === 'light' ? 'dark' : 'light') }}>{children}</Context.Provider>;
}
export const useAdminTheme = () => useContext(Context);

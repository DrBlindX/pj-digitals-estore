import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { palettes, type Palette, type ThemeMode as Mode } from '../../../shared/theme';
export { palettes };
export type { Palette };


const Context = createContext<{ mode: Mode; palette: Palette; toggle: () => void }>({ mode: 'light', palette: palettes.light, toggle: () => {} });
export function AdminThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>('light');
  return <Context.Provider value={{ mode, palette: palettes[mode], toggle: () => setMode(value => value === 'light' ? 'dark' : 'light') }}>{children}</Context.Provider>;
}
export const useAdminTheme = () => useContext(Context);

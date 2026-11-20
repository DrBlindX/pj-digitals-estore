import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { shopPalettes as colors, type ShopColors, type ThemeMode as Mode } from '../../../shared/theme';
export type { Palette, ShopColors } from '../../../shared/theme';

const Context = createContext<{ C: ShopColors; mode: Mode; setMode: (mode: Mode) => void }>({ C: colors.light, mode: 'light', setMode: () => {} });
export function ShopThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>('light');
  return <Context.Provider value={{ C: colors[mode], mode, setMode }}>{children}</Context.Provider>;
}
export const useShopTheme = () => useContext(Context);

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { templateColors, fonts, spacing } from '../../../shared/theme';

export const Colors = templateColors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export const Fonts = Platform.select(fonts);
export const Spacing = spacing;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

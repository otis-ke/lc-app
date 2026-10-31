import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { MainTabs } from './MainTabs';
import { NotificationToast } from '../components/NotificationToast';
import { useTheme } from '../contexts/ThemeContext';
import { colors as staticColors } from '../theme/theme';

export function RootNavigator() {
  const { colors } = useTheme();
  // `background` stays pinned to the frozen dark default, same reasoning as
  // Screen.tsx/navOptions.ts's contentStyle — the rest (header/tab bar
  // colors) is self-contained and safe to follow the live theme.
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: staticColors.bg,
        card: colors.surface,
        primary: colors.primary,
        text: colors.text,
        border: colors.border,
      },
    }),
    [colors]
  );

  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs />
      <NotificationToast />
    </NavigationContainer>
  );
}

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { MainTabs } from './MainTabs';
import { NotificationToast } from '../components/NotificationToast';
import { colors } from '../theme/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs />
      <NotificationToast />
    </NavigationContainer>
  );
}

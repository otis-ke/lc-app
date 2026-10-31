import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors as staticColors, fonts } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

// The header bar itself (background+tint+title) is fully theme-reactive —
// it's self-contained, so there's no risk of it clashing with anything.
// `contentStyle` deliberately stays pinned to the frozen dark default: it's
// the area behind each screen, and screens still paint their own background
// via Screen.tsx, which itself stays dark-pinned until its ~46 consumers'
// headings (frozen `typography` colors) are migrated off the old freeze —
// see Screen.tsx's comment for the full reasoning.
export function useScreenOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: staticColors.bg },
    headerBackTitle: '',
  };
}

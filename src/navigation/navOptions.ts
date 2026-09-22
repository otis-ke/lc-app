import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme/theme';

export const screenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.bodySemiBold, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  headerBackTitle: '',
};

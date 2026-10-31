import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: any;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const { colors: themeColors } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(e);
  };

  const content = loading ? (
    <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'} />
  ) : (
    <Text style={[styles.label, labelStyles[variant], variant === 'ghost' && { color: themeColors.text }]}>{label}</Text>
  );

  if (variant === 'primary' || variant === 'gold') {
    const gradientColors = variant === 'primary' ? [colors.primary, colors.secondary] : [colors.goldLight, colors.gold, colors.goldDark];
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style, isDisabled && styles.disabled]}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        variant === 'ghost' && { backgroundColor: themeColors.surfaceAlt },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
});

const variantStyles = StyleSheet.create({
  primary: {},
  gold: {},
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  ghost: { backgroundColor: colors.surfaceAlt },
  danger: { backgroundColor: colors.danger },
});

const labelStyles = StyleSheet.create({
  primary: { color: '#fff' },
  gold: { color: colors.ink },
  outline: { color: colors.primary },
  ghost: { color: colors.text },
  danger: { color: '#fff' },
});

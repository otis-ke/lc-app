import React from 'react';
import { StyleSheet, View, ViewProps, Text } from 'react-native';
import { colors, fonts, radii, shadow, spacing, typography } from '../theme/theme';

// Deliberately NOT theme-reactive, same reasoning as Screen.tsx: Card is
// used everywhere, including directly on Screen's (frozen dark) canvas, so
// its own background must stay paired with the same frozen default rather
// than risk a light/dark text-on-background mismatch.
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle, style }: { title: React.ReactNode; subtitle?: string; style?: any }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  title: { ...typography.sectionTitle },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 4 },
});

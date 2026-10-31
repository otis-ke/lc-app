import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import type { ScrollViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  dark?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
}

// Deliberately NOT theme-reactive: dozens of screens still set their own
// heading color via the frozen `typography` tokens (baked in at first
// import, for the dark default). If this background flipped to light on
// toggle while those headings stayed dark-mode-light-colored, text would
// go near-invisible. Screen's own canvas stays dark until those screens are
// migrated too — see ThemeContext.tsx for what *is* fully reactive today
// (Card/Button/inputs/nav headers/Profile/Dashboard).
export function Screen({ scroll = true, padded = true, edges, dark, style, children, refreshControl, ...rest }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  // padded={false} only opts a screen out of the cosmetic 20px inset (used
  // by screens with their own full-bleed hero) — every screen still needs
  // clearance from the floating tab bar, which sits over ALL of them.
  const bottomClearance = padded ? styles.padded : styles.bottomSafeOnly;
  const containerProps = scroll
    ? {
        contentContainerStyle: [bottomClearance, style],
        keyboardShouldPersistTaps: 'handled' as const,
        showsVerticalScrollIndicator: false,
        refreshControl,
      }
    : { style: [{ flex: 1 }, bottomClearance, style] };

  return (
    <SafeAreaView style={[styles.safe, dark && styles.dark]} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container {...(containerProps as any)} {...rest}>
          {children}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  dark: { backgroundColor: colors.ink },
  // Extra bottom clearance so content never sits behind the floating
  // CustomTabBar (~56px bar + bottom safe-area inset it adds on top).
  padded: { padding: 20, paddingBottom: 110 },
  bottomSafeOnly: { paddingBottom: 110 },
});

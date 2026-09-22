import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '../lib/network';
import { colors, fonts, radii } from '../theme/theme';

// A floating, translucent "You're offline" pill — shown app-wide (mounted
// once in App.tsx, above the navigator) whenever connectivity drops.
// Previously-viewed blog posts/models/instructors still load, from the
// disk cache in src/lib/cache.ts — this banner just makes that visible
// instead of silently showing stale data with no explanation.
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isOnline ? 0 : 1,
      useNativeDriver: true,
      damping: 16,
      mass: 0.6,
    }).start();
  }, [isOnline, anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
            },
          ],
        },
      ]}
    >
      <BlurView intensity={70} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={styles.pill}>
        <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
        <Text style={styles.text}>You're offline — showing saved content</Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(11,11,12,0.55)',
  },
  text: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#fff' },
});

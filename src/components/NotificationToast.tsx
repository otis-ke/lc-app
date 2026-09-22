import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNewNotifications } from '../lib/notifications';
import { NOTIFICATION_ICONS } from '../lib/notificationIcons';
import { colors, fonts, radii, spacing, shadow } from '../theme/theme';
import type { AppNotification } from '../types';

const AUTO_DISMISS_MS = 4500;

// Mounted once near the root (see RootNavigator) so a pop-up can appear over
// whichever tab/screen is open — this is the "pop up if instructor has sent
// a message" feature, driven by a live Firestore listener rather than OS
// push, so it works on every platform (including web) with no extra setup.
export function NotificationToast() {
  const { session } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;
    const unsubscribe = subscribeToNewNotifications(session.uid, (n) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCurrent(n);
    });
    return unsubscribe;
  }, [session]);

  useEffect(() => {
    if (!current) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [current]);

  function dismiss() {
    Animated.timing(translateY, { toValue: -140, duration: 220, useNativeDriver: true }).start(() => setCurrent(null));
  }

  function handlePress() {
    if (!current) return;
    dismiss();
    navigation.dispatch(CommonActions.navigate({ name: 'DashboardTab', params: { screen: 'Notifications' } }));
  }

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 12), transform: [{ translateY }] }]}
    >
      <Pressable style={styles.card} onPress={handlePress}>
        <View style={styles.iconWrap}>
          <Ionicons name={NOTIFICATION_ICONS[current.type] ?? 'notifications-outline'} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{current.body}</Text>
        </View>
        <Pressable hitSlop={10} onPress={dismiss}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadow.card,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
});

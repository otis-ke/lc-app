import React from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radii } from '../theme/theme';
import type { MainTabParamList } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICONS: Record<keyof MainTabParamList, keyof typeof Feather.glyphMap> = {
  HomeTab: 'home',
  ModelsTab: 'aperture',
  ConnectTab: 'users',
  BlogTab: 'book-open',
  DashboardTab: 'grid',
  ProfileTab: 'user',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Home',
  ModelsTab: 'Models',
  ConnectTab: 'Connect',
  BlogTab: 'Blog',
  DashboardTab: 'Dashboard',
  ProfileTab: 'Profile',
};

// A floating "expanding pill" tab bar: inactive tabs are icon-only, the
// active tab expands to show its label inside a filled capsule — the same
// pattern several current-generation iOS apps use instead of a flat,
// always-on bottom bar. Fully custom (via the Tab.Navigator `tabBar` prop)
// since achieving the inline icon+label pill isn't possible through the
// default tabBarIcon/tabBarLabel slots alone.
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <BlurView intensity={85} tint="light" blurMethod="dimezisBlurViewSdk31Plus" style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const name = route.name as keyof MainTabParamList;

          const onPress = () => {
            LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={6}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Feather name={ICONS[name]} size={19} color={focused ? '#fff' : colors.primary} />
              {focused ? <Text style={styles.label}>{LABELS[name]}</Text> : null}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
  },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#fff' },
});

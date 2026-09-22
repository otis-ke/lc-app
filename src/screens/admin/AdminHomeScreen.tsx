import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, spacing } from '../../theme/theme';

// The admin dashboard is the website's OWN admin panel (admin.html +
// admindash/*.html), loaded here in-app via WebView — deliberately NOT a
// separate native rebuild. That panel already has full CRUD for every
// content collection (blog, models, instructors, banners) and its own
// students list, all wired to the same live Firestore project this app
// reads from. Keeping ONE admin implementation means content editors never
// see a different feature set (or different bugs) depending on whether
// they're on the website or in the app.
const ADMIN_URL = 'https://lcmodelingschool.com/admin.html';

export default function AdminHomeScreen() {
  const navigation = useNavigation();
  const { isAdmin, loading: authLoading } = useAuth();
  const [webLoading, setWebLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleBackPress = useCallback(() => {
    if (canGoBack) webviewRef.current?.goBack();
    else navigation.goBack();
  }, [canGoBack, navigation]);

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={28} color={colors.textMuted} />
        <Text style={styles.deniedText}>Admins only.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={handleBackPress} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>{canGoBack ? 'Back' : 'Profile'}</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Admin Panel</Text>
        <Pressable onPress={() => webviewRef.current?.reload()} hitSlop={10} style={styles.reloadBtn}>
          <Ionicons name="refresh" size={20} color={colors.text} />
        </Pressable>
      </View>

      <WebView
        ref={webviewRef}
        source={{ uri: ADMIN_URL }}
        style={styles.webview}
        onLoadStart={() => setWebLoading(true)}
        onLoadEnd={() => setWebLoading(false)}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading the admin panel…</Text>
          </View>
        )}
      />
      {webLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.bg },
  deniedText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 70 },
  backText: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
  topBarTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  reloadBtn: { minWidth: 70, alignItems: 'flex-end' },
  webview: { flex: 1, backgroundColor: colors.bg },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});

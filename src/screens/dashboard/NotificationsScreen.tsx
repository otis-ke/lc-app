import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/notifications';
import { NOTIFICATION_ICONS } from '../../lib/notificationIcons';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AppNotification } from '../../types';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchNotifications(session.uid);
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePress(n: AppNotification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={async () => {
              if (!session) return;
              await markAllNotificationsRead(session.uid);
              load();
            }}
          >
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>You're all caught up.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {notifications.map((n) => (
            <Pressable key={n.id} style={[styles.card, !n.read && styles.cardUnread]} onPress={() => handlePress(n)}>
              <View style={styles.iconWrap}>
                <Ionicons name={NOTIFICATION_ICONS[n.type] ?? 'notifications-outline'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
              </View>
              {!n.read ? <View style={styles.dot} /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.pageTitle },
  markAll: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: { backgroundColor: '#fbf6ee', borderColor: colors.goldLight },
  iconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  notifBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  notifTime: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 4 },
});

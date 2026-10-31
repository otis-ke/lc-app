import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchAuditLog } from '../../lib/adminLog';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AdminActionType, AdminAuditEntry } from '../../types';

const ACTION_META: Record<AdminActionType, { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  instructor_approved: { label: 'Instructor approved', icon: 'checkmark-circle', color: colors.success },
  instructor_rejected: { label: 'Instructor rejected', icon: 'close-circle', color: colors.danger },
  student_approved: { label: 'Student approved', icon: 'checkmark-circle', color: colors.success },
  student_rejected: { label: 'Student rejected', icon: 'close-circle', color: colors.danger },
  payment_recorded: { label: 'Payment recorded', icon: 'cash-outline', color: colors.primary },
  payment_status_changed: { label: 'Payment status changed', icon: 'swap-horizontal-outline', color: colors.primary },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminAuditLogScreen() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAuditLog();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      <Text style={styles.title}>Audit Log</Text>
      <Text style={styles.subtitle}>Every approval, rejection and finance decision, newest first.</Text>

      {entries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No admin actions logged yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action];
            return (
              <View key={entry.id} style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: meta.color + '1a' }]}>
                  <Ionicons name={meta.icon} size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {meta.label} · <Text style={styles.rowTarget}>{entry.target_name}</Text>
                  </Text>
                  <Text style={styles.rowMeta}>
                    by {entry.performed_by_name} · {timeAgo(entry.created_at)}
                  </Text>
                  {entry.note ? <Text style={styles.rowNote}>"{entry.note}"</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  rowTarget: { fontFamily: fonts.bodySemiBold },
  rowMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  rowNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
});

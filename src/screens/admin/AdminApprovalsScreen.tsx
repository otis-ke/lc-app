import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchPendingInstructorApplications, fetchResolvedInstructorApplications } from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { InstructorApplication } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function AdminApprovalsScreen() {
  const navigation = useNavigation<Nav>();
  const [pending, setPending] = useState<InstructorApplication[]>([]);
  const [resolved, setResolved] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([
        fetchPendingInstructorApplications(),
        fetchResolvedInstructorApplications(),
      ]);
      setPending(p);
      setResolved(r);
    } catch {
      setPending([]);
      setResolved([]);
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
      <Text style={styles.title}>Instructor Approvals</Text>
      <Text style={styles.subtitle}>Tap an application to review their full details and decide.</Text>

      {pending.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-done-circle-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No pending instructor applications.</Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginBottom: spacing.lg }}>
          {pending.map((app) => (
            <Pressable
              key={app.id}
              style={styles.card}
              onPress={() => navigation.navigate('InstructorApplicationDetail', { applicationId: app.id })}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{app.full_name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{app.specialization} · {app.location}, {app.country}</Text>
                {!app.uid ? <Text style={styles.warning}>⚠ No account linked</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      {resolved.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Recently Reviewed</Text>
          <View style={{ gap: 8 }}>
            {resolved.slice(0, 20).map((app) => (
              <Pressable
                key={app.id}
                style={styles.resolvedRow}
                onPress={() => navigation.navigate('InstructorApplicationDetail', { applicationId: app.id })}
              >
                <Text style={styles.resolvedName} numberOfLines={1}>{app.full_name}</Text>
                <Text style={[styles.resolvedStatus, app.status === 'contacted' ? { color: colors.success } : { color: colors.danger }]}>
                  {app.status === 'contacted' ? 'Approved' : 'Rejected'}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  warning: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.dangerDark, marginTop: 4 },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  resolvedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  resolvedName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  resolvedStatus: { fontFamily: fonts.bodySemiBold, fontSize: 12.5 },
});

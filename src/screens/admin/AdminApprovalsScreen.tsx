import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../components/Button';
import { fetchPendingInstructorApplications, approveInstructorApplication, rejectInstructorApplication } from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { InstructorApplication } from '../../types';

export default function AdminApprovalsScreen() {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingInstructorApplications();
      setApplications(data);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(app: InstructorApplication) {
    setBusyId(app.id);
    try {
      await approveInstructorApplication(app);
      await load();
    } catch (e: any) {
      Alert.alert('Could not approve', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(app: InstructorApplication) {
    setBusyId(app.id);
    try {
      await rejectInstructorApplication(app.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

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
      <Text style={styles.title}>Pending Approvals</Text>

      {applications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-done-circle-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No pending instructor applications.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {applications.map((app) => (
            <View key={app.id} style={styles.card}>
              <Text style={styles.name}>{app.full_name}</Text>
              <Text style={styles.meta}>{app.specialization} · {app.location}, {app.country}</Text>
              <Text style={styles.meta}>{app.email} · {app.phone}</Text>
              {!app.uid ? (
                <Text style={styles.warning}>⚠ Applied without an account — cannot be approved into a live profile.</Text>
              ) : null}
              <View style={styles.actionRow}>
                <Button
                  label="Approve"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  loading={busyId === app.id}
                  disabled={!app.uid}
                  onPress={() => handleApprove(app)}
                />
                <Button
                  label="Reject"
                  variant="outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  loading={busyId === app.id}
                  onPress={() => handleReject(app)}
                />
              </View>
            </View>
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
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  warning: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.dangerDark, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
});

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { fetchApplicationsForCasting, updateApplicationStatus } from '../../lib/castings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { CastingApplication, CastingApplicationStatus } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'CastingApplicants'>;

const STATUS_COLOR: Record<CastingApplicationStatus, string> = {
  submitted: colors.textMuted,
  shortlisted: colors.secondary,
  accepted: colors.success,
  rejected: colors.danger,
};

export default function CastingApplicantsScreen() {
  const route = useRoute<Rt>();
  const { castingId, castingTitle } = route.params;
  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchApplicationsForCasting(castingId);
      setApplications(data);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [castingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(app: CastingApplication, status: CastingApplicationStatus) {
    setBusyId(app.id);
    try {
      await updateApplicationStatus(app, status);
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
      <Text style={styles.title}>Applicants</Text>
      <Text style={styles.subtitle}>{castingTitle}</Text>

      {applications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No applications yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {applications.map((app) => (
            <View key={app.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{app.model_name}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[app.status] }]}>{app.status}</Text>
              </View>
              {app.message ? <Text style={styles.message}>{app.message}</Text> : null}
              {app.status === 'submitted' || app.status === 'shortlisted' ? (
                <View style={styles.actionRow}>
                  {app.status === 'submitted' ? (
                    <Button
                      label="Shortlist"
                      variant="outline"
                      fullWidth={false}
                      style={{ flex: 1 }}
                      loading={busyId === app.id}
                      onPress={() => act(app, 'shortlisted')}
                    />
                  ) : null}
                  <Button
                    label="Accept"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    loading={busyId === app.id}
                    onPress={() => act(app, 'accepted')}
                  />
                  <Button
                    label="Reject"
                    variant="ghost"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    loading={busyId === app.id}
                    onPress={() => act(app, 'rejected')}
                  />
                </View>
              ) : null}
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
  title: { ...typography.pageTitle },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text },
  status: { fontFamily: fonts.bodySemiBold, fontSize: 12, textTransform: 'capitalize' },
  message: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
});

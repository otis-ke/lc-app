import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextAreaField } from '../../components/FormFields';
import { useAuth } from '../../contexts/AuthContext';
import {
  approveInstructorApplication,
  fetchInstructorApplication,
  rejectInstructorApplication,
} from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { InstructorApplication } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type Rt = RouteProp<DashboardStackParamList, 'InstructorApplicationDetail'>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function InstructorApplicationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { profile, session } = useAuth();
  const { applicationId } = route.params;

  const [app, setApp] = useState<InstructorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  async function load() {
    try {
      const data = await fetchInstructorApplication(applicationId);
      setApp(data);
    } catch {
      setApp(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [applicationId]);

  async function handleApprove() {
    if (!app || !session) return;
    setBusy('approve');
    try {
      await approveInstructorApplication(app, session.uid, profile?.full_name ?? 'Admin');
      Alert.alert('Approved', `${app.full_name} is now a live instructor.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Could not approve', e?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!app || !session) return;
    setBusy('reject');
    try {
      await rejectInstructorApplication(app, session.uid, profile?.full_name ?? 'Admin', reason.trim() || undefined);
      Alert.alert('Application declined', 'The applicant has been notified.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.textMuted} />
        <Text style={styles.emptyText}>Application not found.</Text>
      </View>
    );
  }

  const isPending = app.status === 'new';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{app.full_name}</Text>
        <View style={[styles.statusPill, statusPillStyle(app.status)]}>
          <Text style={[styles.statusText, statusTextStyle(app.status)]}>
            {app.status === 'new' ? 'Pending' : app.status === 'contacted' ? 'Approved' : 'Rejected'}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Application Details</Text>
        <Field label="Phone" value={app.phone} />
        <Field label="Email" value={app.email} />
        <Field label="Country" value={app.country} />
        <Field label="Location" value={app.location} />
        <Field label="Specialization" value={app.specialization} />
        <Field label="Years of Experience" value={app.experience_years != null ? String(app.experience_years) : 'Not provided'} />
        <Field label="Social Media" value={app.socials ?? 'Not provided'} />
        <Field label="Applied" value={new Date(app.created_at).toLocaleString()} />
        <Field label="Account linked" value={app.uid ? 'Yes — can be approved into a live profile' : 'No — applied without an account'} />
      </Card>

      {!isPending ? (
        <Card>
          <Text style={styles.cardTitle}>Review History</Text>
          <Field label="Decision" value={app.status === 'contacted' ? 'Approved' : 'Rejected'} />
          {app.reviewed_by_name ? <Field label="Reviewed by" value={app.reviewed_by_name} /> : null}
          {app.reviewed_at ? <Field label="Reviewed at" value={new Date(app.reviewed_at).toLocaleString()} /> : null}
          {app.review_note ? <Field label="Note" value={app.review_note} /> : null}
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Decision</Text>
          {!app.uid ? (
            <Text style={styles.warning}>⚠ Applied without an account — cannot be approved into a live profile, but can still be rejected.</Text>
          ) : null}
          <TextAreaField
            label="Rejection reason (optional, shown to applicant)"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Portfolio incomplete, please reapply with more experience details"
          />
          <View style={styles.actionRow}>
            <Button label="Approve" style={{ flex: 1 }} disabled={!app.uid} loading={busy === 'approve'} onPress={handleApprove} />
            <Button label="Reject" variant="outline" style={{ flex: 1 }} loading={busy === 'reject'} onPress={handleReject} />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function statusPillStyle(status: string) {
  if (status === 'contacted') return { backgroundColor: colors.success + '22' };
  if (status === 'closed') return { backgroundColor: colors.danger + '22' };
  return { backgroundColor: colors.surfaceAlt };
}
function statusTextStyle(status: string) {
  if (status === 'contacted') return { color: colors.success };
  if (status === 'closed') return { color: colors.danger };
  return { color: colors.textMuted };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { ...typography.pageTitle, flex: 1, textAlign: 'left' },
  statusPill: { borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, marginTop: 2 },
  warning: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.dangerDark, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
});

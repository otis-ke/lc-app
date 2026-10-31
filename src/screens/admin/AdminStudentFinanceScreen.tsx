import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField, TextAreaField, RadioGroup } from '../../components/FormFields';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyModelProfile, rejectStudentProfile, setStudentVerified } from '../../lib/models';
import { fetchLedgerForStudent, recordLedgerEntry, setPaymentStatus } from '../../lib/finance';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { AppModelProfile, FinanceLedgerEntry, LedgerEntryType, PaymentStatus } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'AdminStudentFinance'>;

const STATUS_OPTIONS: PaymentStatus[] = ['paid', 'partial', 'unpaid', 'overdue'];
const TYPE_OPTIONS: { label: string; value: LedgerEntryType }[] = [
  { label: 'Payment', value: 'payment' },
  { label: 'Charge', value: 'charge' },
  { label: 'Adjustment', value: 'adjustment' },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AdminStudentFinanceScreen() {
  const route = useRoute<Rt>();
  const { session, profile } = useAuth();
  const { studentUid, studentName } = route.params;

  const [student, setStudent] = useState<AppModelProfile | null>(null);
  const [ledger, setLedger] = useState<FinanceLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [entryType, setEntryType] = useState<LedgerEntryType>('payment');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([fetchMyModelProfile(studentUid), fetchLedgerForStudent(studentUid)]);
      setStudent(s);
      setLedger(l);
    } catch {
      setLedger([]);
    } finally {
      setLoading(false);
    }
  }, [studentUid]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddEntry() {
    const parsed = Number(amount);
    if (!parsed || Number.isNaN(parsed)) return;
    if (!session) return;
    setSaving(true);
    const signedAmount = entryType === 'charge' ? -Math.abs(parsed) : Math.abs(parsed);
    await recordLedgerEntry({
      studentUid,
      studentName,
      amount: signedAmount,
      type: entryType,
      note: note.trim() || (entryType === 'payment' ? 'Payment received' : entryType === 'charge' ? 'Charge added' : 'Balance adjustment'),
      recordedByUid: session.uid,
      recordedByName: profile?.full_name ?? 'Admin',
    });
    setAmount('');
    setNote('');
    setSaving(false);
    await load();
  }

  async function handleStatusChange(status: PaymentStatus) {
    if (!session) return;
    setStatusSaving(true);
    await setPaymentStatus(studentUid, status, studentName, session.uid, profile?.full_name ?? 'Admin');
    setStatusSaving(false);
    await load();
  }

  async function handleApprove() {
    if (!session) return;
    setReviewBusy('approve');
    try {
      await setStudentVerified(studentUid, true, studentName, session.uid, profile?.full_name ?? 'Admin');
      await load();
    } finally {
      setReviewBusy(null);
    }
  }

  async function handleReject() {
    if (!session) return;
    setReviewBusy('reject');
    try {
      await rejectStudentProfile(studentUid, studentName, session.uid, profile?.full_name ?? 'Admin', rejectReason.trim() || undefined);
      setRejectReason('');
      Alert.alert('Student declined', 'They have been notified and can update their profile for another review.');
      await load();
    } finally {
      setReviewBusy(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const balance = student?.balance ?? 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{studentName}</Text>

      {student && student.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {student.photos.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noPhotoBox}>
          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
          <Text style={styles.noPhotoText}>No photos uploaded yet.</Text>
        </View>
      )}

      <Card>
        <Text style={styles.cardTitle}>Portfolio &amp; Bio</Text>
        <Field label="Age" value={student?.age != null ? String(student.age) : 'Not provided'} />
        <Field label="Location" value={student?.location ?? 'Not provided'} />
        <Field label="Height" value={student?.height_cm != null ? `${student.height_cm} cm` : 'Not provided'} />
        <Field
          label="Measurements"
          value={[student?.bust, student?.waist, student?.hips].filter(Boolean).join(' / ') || 'Not provided'}
        />
        <Field label="Shoe Size" value={student?.shoe_size ?? 'Not provided'} />
        <Field label="Categories" value={student?.categories.length ? student.categories.join(', ') : 'Not provided'} />
        <Field label="Skills" value={student?.skills.length ? student.skills.join(', ') : 'Not provided'} />
        <Field label="Bio" value={student?.bio?.trim() || 'Not provided'} />
        <Field
          label="Socials"
          value={[student?.social_instagram, student?.social_tiktok, student?.social_other].filter(Boolean).join(' · ') || 'Not provided'}
        />
      </Card>

      <Card style={styles.reviewCard}>
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.cardTitle}>Profile Review</Text>
          <View style={[styles.reviewPill, reviewPillStyle(student?.review_status)]}>
            <Text style={[styles.reviewPillText, reviewTextStyle(student?.review_status)]}>
              {student?.review_status === 'approved' ? 'Approved' : student?.review_status === 'rejected' ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>
        {student?.review_status === 'rejected' && student.review_note ? (
          <Text style={styles.reviewNote}>Last note: {student.review_note}</Text>
        ) : null}
        {student?.review_status !== 'approved' ? (
          <TextAreaField
            label="Rejection reason (optional, shown to student)"
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="e.g. Please add full-body photos before resubmitting"
          />
        ) : null}
        <View style={styles.actionRow}>
          <Button
            label={student?.review_status === 'approved' ? 'Approved ✓' : 'Approve Student'}
            variant={student?.review_status === 'approved' ? 'outline' : 'primary'}
            style={{ flex: 1 }}
            disabled={student?.review_status === 'approved'}
            loading={reviewBusy === 'approve'}
            onPress={handleApprove}
          />
          <Button
            label="Reject"
            variant="outline"
            style={{ flex: 1 }}
            disabled={student?.review_status === 'rejected'}
            loading={reviewBusy === 'reject'}
            onPress={handleReject}
          />
        </View>
      </Card>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: colors.danger }]}>KSh {balance.toLocaleString()}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Payment status</Text>
        <RadioGroup
          label=""
          value={student?.payment_status ?? 'unpaid'}
          options={STATUS_OPTIONS}
          onChange={(v) => handleStatusChange(v as PaymentStatus)}
        />
        {statusSaving ? <ActivityIndicator color={colors.primary} /> : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Record a payment or adjustment</Text>
        <RadioGroup
          label="Type"
          value={TYPE_OPTIONS.find((t) => t.value === entryType)?.label ?? 'Payment'}
          options={TYPE_OPTIONS.map((t) => t.label)}
          onChange={(label) => setEntryType(TYPE_OPTIONS.find((t) => t.label === label)?.value ?? 'payment')}
        />
        <TextField label="Amount (KSh)" placeholder="e.g. 5000" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TextField label="Note" placeholder="e.g. M-Pesa payment for July" value={note} onChangeText={setNote} />
        <Button label="Save" onPress={handleAddEntry} loading={saving} style={{ marginTop: spacing.xs }} />
      </Card>

      <Text style={styles.sectionLabel}>History</Text>
      <View style={{ gap: 8 }}>
        {ledger.length === 0 ? (
          <Text style={styles.emptyText}>No entries yet.</Text>
        ) : (
          ledger.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryNote}>{entry.note}</Text>
                <Text style={styles.entryMeta}>{new Date(entry.created_at).toLocaleDateString()} · {entry.recorded_by_name}</Text>
              </View>
              <Text style={[styles.entryAmount, { color: entry.amount >= 0 ? colors.success : colors.danger }]}>
                {entry.amount >= 0 ? '+' : ''}KSh {entry.amount.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function reviewPillStyle(status?: string) {
  if (status === 'approved') return { backgroundColor: colors.success + '22' };
  if (status === 'rejected') return { backgroundColor: colors.danger + '22' };
  return { backgroundColor: colors.gold + '22' };
}
function reviewTextStyle(status?: string) {
  if (status === 'approved') return { color: colors.success };
  if (status === 'rejected') return { color: colors.danger };
  return { color: colors.goldDark };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle },
  photoRow: { gap: spacing.sm },
  photo: { width: 110, height: 140, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  noPhotoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: spacing.sm },
  noPhotoText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontFamily: fonts.body, fontSize: 14, color: colors.text, marginTop: 2 },
  reviewCard: { gap: 0 },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewPill: { borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10 },
  reviewPillText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5 },
  reviewNote: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.sm, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  balanceCard: { alignItems: 'center', paddingVertical: spacing.md },
  balanceLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  balanceValue: { fontFamily: fonts.bodyBold, fontSize: 26, color: colors.text, marginTop: 2 },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  entryNote: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  entryMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  entryAmount: { fontFamily: fonts.bodyBold, fontSize: 14 },
});

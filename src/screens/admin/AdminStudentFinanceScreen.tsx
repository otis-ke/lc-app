import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField, RadioGroup } from '../../components/FormFields';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyModelProfile, setStudentVerified } from '../../lib/models';
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
  const [verifying, setVerifying] = useState(false);

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
    setStatusSaving(true);
    await setPaymentStatus(studentUid, status);
    setStatusSaving(false);
    await load();
  }

  async function handleToggleVerified() {
    if (!student) return;
    setVerifying(true);
    await setStudentVerified(studentUid, !student.verified);
    setVerifying(false);
    await load();
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

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: colors.danger }]}>KSh {balance.toLocaleString()}</Text>
      </Card>

      <Card style={styles.approveRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Profile approval</Text>
          <Text style={styles.approveHint}>
            {student?.verified ? 'This student is approved and verified.' : 'Not yet reviewed by admin.'}
          </Text>
        </View>
        <Button
          label={student?.verified ? 'Approved ✓' : 'Approve Student'}
          variant={student?.verified ? 'outline' : 'primary'}
          fullWidth={false}
          loading={verifying}
          onPress={handleToggleVerified}
        />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle },
  balanceCard: { alignItems: 'center', paddingVertical: spacing.md },
  balanceLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  balanceValue: { fontFamily: fonts.bodyBold, fontSize: 26, color: colors.text, marginTop: 2 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: spacing.sm },
  approveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  approveHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
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

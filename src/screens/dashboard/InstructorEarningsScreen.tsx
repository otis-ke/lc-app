import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchBookingsForInstructor } from '../../lib/bookings';
import { fetchWithdrawalsForInstructor, requestWithdrawal } from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { WithdrawalRequest } from '../../types';

export default function InstructorEarningsScreen() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const [bookings, withdrawalList] = await Promise.all([
        fetchBookingsForInstructor(session.uid),
        fetchWithdrawalsForInstructor(session.uid),
      ]);
      const earned = bookings
        .filter((b) => b.booking_status === 'confirmed' || b.booking_status === 'completed')
        .reduce((sum, b) => sum + b.instructor_earning, 0);
      const withdrawn = withdrawalList
        .filter((w) => w.status === 'paid' || w.status === 'requested')
        .reduce((sum, w) => sum + w.amount, 0);
      setTotalEarned(earned);
      setTotalWithdrawn(withdrawn);
      setWithdrawals(withdrawalList);
    } catch {
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const available = Math.max(0, totalEarned - totalWithdrawn);

  async function handleRequestWithdrawal() {
    if (!session || available <= 0) return;
    setRequesting(true);
    try {
      await requestWithdrawal(session.uid, profile?.full_name ?? 'Instructor', available);
      Alert.alert('Requested', 'Your withdrawal request has been sent to L&C for processing.');
      await load();
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Earnings</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Available to withdraw</Text>
        <Text style={styles.summaryValue}>KSh {available.toLocaleString()}</Text>
        <Text style={styles.summaryNote}>
          Your 80% share from confirmed &amp; completed sessions (KSh {totalEarned.toLocaleString()} earned total).
        </Text>
        <Button
          label="Request Withdrawal"
          onPress={handleRequestWithdrawal}
          loading={requesting}
          disabled={available <= 0}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <SectionTitle title="Withdrawal History" />
      {withdrawals.length === 0 ? (
        <Text style={styles.empty}>No withdrawal requests yet.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {withdrawals.map((w) => (
            <View key={w.id} style={styles.row}>
              <Text style={styles.rowAmount}>KSh {w.amount.toLocaleString()}</Text>
              <Text
                style={[
                  styles.rowStatus,
                  w.status === 'paid' && { color: colors.success },
                  w.status === 'rejected' && { color: colors.danger },
                ]}
              >
                {w.status}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  summaryCard: { marginBottom: spacing.lg },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  summaryValue: { fontFamily: fonts.heading, fontSize: 32, color: colors.primary, marginTop: 4 },
  summaryNote: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 8, lineHeight: 17 },
  empty: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowAmount: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  rowStatus: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
});

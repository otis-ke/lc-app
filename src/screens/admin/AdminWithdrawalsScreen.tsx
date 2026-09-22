import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../components/Button';
import { fetchAllWithdrawals, updateWithdrawalStatus } from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { WithdrawalRequest } from '../../types';

export default function AdminWithdrawalsScreen() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllWithdrawals();
      setWithdrawals(data);
    } catch {
      setWithdrawals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(w: WithdrawalRequest, status: 'paid' | 'rejected') {
    setBusyId(w.id);
    try {
      await updateWithdrawalStatus(w.id, status, w.instructor_uid, w.amount);
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

  const pending = withdrawals.filter((w) => w.status === 'requested');
  const resolved = withdrawals.filter((w) => w.status !== 'requested');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Withdrawal Requests</Text>

      {withdrawals.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cash-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No withdrawal requests yet.</Text>
        </View>
      ) : (
        <>
          {pending.length > 0 ? (
            <View style={{ gap: 12, marginBottom: spacing.lg }}>
              {pending.map((w) => (
                <View key={w.id} style={styles.card}>
                  <Text style={styles.name}>{w.instructor_name}</Text>
                  <Text style={styles.amount}>KSh {w.amount.toLocaleString()}</Text>
                  <View style={styles.actionRow}>
                    <Button label="Mark Paid" fullWidth={false} style={{ flex: 1 }} loading={busyId === w.id} onPress={() => act(w, 'paid')} />
                    <Button label="Reject" variant="outline" fullWidth={false} style={{ flex: 1 }} loading={busyId === w.id} onPress={() => act(w, 'rejected')} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {resolved.length > 0 ? (
            <View style={{ gap: 8 }}>
              {resolved.map((w) => (
                <View key={w.id} style={styles.resolvedRow}>
                  <Text style={styles.resolvedName}>{w.instructor_name}</Text>
                  <Text style={styles.resolvedAmount}>KSh {w.amount.toLocaleString()}</Text>
                  <Text style={[styles.resolvedStatus, w.status === 'paid' ? { color: colors.success } : { color: colors.danger }]}>
                    {w.status}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
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
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  amount: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.primary, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  resolvedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  resolvedName: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text, flex: 1 },
  resolvedAmount: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text, marginRight: 10 },
  resolvedStatus: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, textTransform: 'capitalize' },
});

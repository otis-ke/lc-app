import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyModelProfile } from '../../lib/models';
import { fetchLedgerForStudent } from '../../lib/finance';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AppModelProfile, FinanceLedgerEntry, PaymentStatus } from '../../types';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid up',
  partial: 'Partially paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
};

const STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: colors.success,
  partial: colors.gold,
  unpaid: colors.textMuted,
  overdue: colors.danger,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MyFinanceScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<AppModelProfile | null>(null);
  const [ledger, setLedger] = useState<FinanceLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    Promise.all([fetchMyModelProfile(session.uid), fetchLedgerForStudent(session.uid)])
      .then(([p, l]) => {
        setProfile(p);
        setLedger(l);
      })
      .catch(() => setLedger([]))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const balance = profile?.balance ?? 0;
  const status = profile?.payment_status ?? 'unpaid';

  return (
    <Screen>
      <Text style={styles.title}>My Finance</Text>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: colors.danger }]}>
          KSh {balance.toLocaleString()}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[status] + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
        </View>
        {balance < 0 ? (
          <Text style={styles.balanceHint}>
            You owe the school KSh {Math.abs(balance).toLocaleString()}. Pay the school directly, then admin will
            update your balance here.
          </Text>
        ) : (
          <Text style={styles.balanceHint}>Managed by L&C Modeling Academy admin.</Text>
        )}
      </Card>

      <Text style={styles.sectionLabel}>History</Text>
      {ledger.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No payments or adjustments recorded yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {ledger.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryNote}>{entry.note || entry.type}</Text>
                <Text style={styles.entryMeta}>
                  {timeAgo(entry.created_at)} · {entry.recorded_by_name || 'Admin'}
                </Text>
              </View>
              <Text style={[styles.entryAmount, { color: entry.amount >= 0 ? colors.success : colors.danger }]}>
                {entry.amount >= 0 ? '+' : ''}KSh {entry.amount.toLocaleString()}
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
  balanceCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: 6, marginBottom: spacing.lg },
  balanceLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  balanceValue: { fontFamily: fonts.bodyBold, fontSize: 30, color: colors.text },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5 },
  balanceHint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: spacing.md },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
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

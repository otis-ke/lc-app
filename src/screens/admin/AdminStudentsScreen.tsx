import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAllStudents } from '../../lib/finance';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { AppModelProfile, PaymentStatus, ReviewStatus } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: colors.success,
  partial: colors.gold,
  unpaid: colors.textMuted,
  overdue: colors.danger,
};

const REVIEW_COLOR: Record<ReviewStatus, string> = {
  approved: colors.success,
  pending: colors.gold,
  rejected: colors.danger,
};
const REVIEW_ICON: Record<ReviewStatus, React.ComponentProps<typeof Ionicons>['name']> = {
  approved: 'checkmark-circle',
  pending: 'time-outline',
  rejected: 'close-circle',
};

export default function AdminStudentsScreen() {
  const navigation = useNavigation<Nav>();
  const [students, setStudents] = useState<AppModelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllStudents();
      setStudents(data);
    } catch {
      setStudents([]);
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

  const pending = students.filter((s) => s.review_status === 'pending');
  const others = students.filter((s) => s.review_status !== 'pending');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Students</Text>
      <Text style={styles.subtitle}>Tap a student to review their portfolio, finances and decide.</Text>

      {students.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No student profiles yet.</Text>
        </View>
      ) : (
        <>
          {pending.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Awaiting Review ({pending.length})</Text>
              <View style={{ gap: 10, marginBottom: spacing.lg }}>
                {pending.map((s) => (
                  <StudentRow key={s.id} student={s} onPress={() => navigation.navigate('AdminStudentFinance', { studentUid: s.id, studentName: s.full_name })} />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>All Students</Text>
          <View style={{ gap: 10 }}>
            {others.map((s) => (
              <StudentRow key={s.id} student={s} onPress={() => navigation.navigate('AdminStudentFinance', { studentUid: s.id, studentName: s.full_name })} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StudentRow({ student: s, onPress }: { student: AppModelProfile; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{s.full_name || 'Unnamed student'}</Text>
          <Ionicons name={REVIEW_ICON[s.review_status]} size={15} color={REVIEW_COLOR[s.review_status]} />
        </View>
        <Text style={styles.balance}>KSh {s.balance.toLocaleString()}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[s.payment_status] + '22' }]}>
        <Text style={[styles.statusText, { color: STATUS_COLOR[s.payment_status] }]}>{s.payment_status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
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
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  balance: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statusPill: { borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, textTransform: 'capitalize' },
});

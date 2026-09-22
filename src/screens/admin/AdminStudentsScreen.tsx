import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAllStudents } from '../../lib/finance';
import { setStudentVerified } from '../../lib/models';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { AppModelProfile, PaymentStatus } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: colors.success,
  partial: colors.gold,
  unpaid: colors.textMuted,
  overdue: colors.danger,
};

export default function AdminStudentsScreen() {
  const navigation = useNavigation<Nav>();
  const [students, setStudents] = useState<AppModelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleToggleVerified(student: AppModelProfile) {
    setBusyId(student.id);
    try {
      await setStudentVerified(student.id, !student.verified);
      await load();
    } finally {
      setBusyId(null);
    }
  }

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
      <Text style={styles.title}>Students</Text>

      {students.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No student profiles yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {students.map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('AdminStudentFinance', { studentUid: s.id, studentName: s.full_name })}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{s.full_name || 'Unnamed student'}</Text>
                  {s.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.secondary} /> : null}
                </View>
                <Text style={styles.balance}>KSh {s.balance.toLocaleString()}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[s.payment_status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[s.payment_status] }]}>{s.payment_status}</Text>
              </View>
              <Pressable
                hitSlop={8}
                style={[styles.approveBtn, s.verified && styles.approveBtnDone]}
                disabled={busyId === s.id}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleVerified(s);
                }}
              >
                {busyId === s.id ? (
                  <ActivityIndicator size="small" color={s.verified ? colors.success : '#fff'} />
                ) : (
                  <Text style={[styles.approveBtnText, s.verified && styles.approveBtnTextDone]}>
                    {s.verified ? 'Approved' : 'Approve'}
                  </Text>
                )}
              </Pressable>
            </Pressable>
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
  approveBtn: {
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  approveBtnDone: { backgroundColor: colors.success + '1a' },
  approveBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: '#fff' },
  approveBtnTextDone: { color: colors.success },
});

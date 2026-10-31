import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchFinanceSummary } from '../../lib/finance';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickLink {
  icon: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export default function SuperAdminScreen() {
  const navigation = useNavigation<Nav>();
  const [summary, setSummary] = useState<{ totalCollected: number; totalOutstanding: number; studentCount: number } | null>(null);

  useEffect(() => {
    fetchFinanceSummary()
      .then(setSummary)
      .catch(() => setSummary({ totalCollected: 0, totalOutstanding: 0, studentCount: 0 }));
  }, []);

  const links: QuickLink[] = [
    { icon: 'stats-chart-outline', title: 'Business Overview', subtitle: 'Users, bookings, revenue & commission', onPress: () => navigation.navigate('AdminOverview') },
    { icon: 'people-outline', title: 'Students', subtitle: 'Balances & payment status', onPress: () => navigation.navigate('AdminStudents') },
    { icon: 'checkmark-done-outline', title: 'Instructor Approvals', subtitle: 'Pending applications', onPress: () => navigation.navigate('AdminApprovals') },
    { icon: 'cash-outline', title: 'Withdrawals', subtitle: 'Instructor payout requests', onPress: () => navigation.navigate('AdminWithdrawals') },
    { icon: 'school-outline', title: 'Courses', subtitle: 'L&C Academy content', onPress: () => navigation.navigate('AdminCourses') },
    { icon: 'chatbubbles-outline', title: 'Conversations', subtitle: 'Every student ↔ instructor thread', onPress: () => navigation.navigate('AdminChats') },
    { icon: 'analytics-outline', title: 'Analytics', subtitle: 'Signups, approvals, courses & finance', onPress: () => navigation.navigate('AdminAnalytics') },
    { icon: 'document-text-outline', title: 'Audit Log', subtitle: 'Every approve/reject decision made', onPress: () => navigation.navigate('AdminAuditLog') },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Super Admin</Text>
      <Text style={styles.subtitle}>Full platform visibility and control.</Text>

      {!summary ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.success }]}>KSh {summary.totalCollected.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.danger }]}>KSh {summary.totalOutstanding.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Outstanding</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{summary.studentCount}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Every Admin Tool</Text>
      <View style={{ gap: 10 }}>
        {links.map((l) => (
          <Pressable key={l.title} style={styles.card} onPress={l.onPress}>
            <View style={styles.cardIcon}>
              <Ionicons name={l.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{l.title}</Text>
              <Text style={styles.cardSubtitle}>{l.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.xl },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
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
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  cardSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
});

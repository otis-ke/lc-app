import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchPlatformAnalytics } from '../../lib/analytics';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { PlatformAnalytics } from '../../lib/analytics';

function Tile({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function SignupsChart({ data }: { data: PlatformAnalytics['signupsLast7Days'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.chartRow}>
      {data.map((d, i) => (
        <View key={i} style={styles.chartCol}>
          <Text style={styles.chartCount}>{d.count}</Text>
          <View style={styles.chartBarTrack}>
            <View style={[styles.chartBar, { height: `${Math.max(4, (d.count / max) * 100)}%` }]} />
          </View>
          <Text style={styles.chartLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AdminAnalyticsScreen() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);

  useEffect(() => {
    fetchPlatformAnalytics()
      .then(setData)
      .catch(() =>
        setData({
          totals: { users: 0, models: 0, instructors: 0, brands: 0 },
          signupsLast7Days: [],
          pendingInstructorApplications: 0,
          pendingStudentReviews: 0,
          approvedInstructors: 0,
          rejectedInstructors: 0,
          approvedStudents: 0,
          rejectedStudents: 0,
          courses: { total: 0, published: 0 },
          enrollments: { total: 0, paid: 0 },
          conversations: 0,
          openCastings: 0,
        })
      );
  }, []);

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalInstructorDecisions = data.approvedInstructors + data.rejectedInstructors;
  const totalStudentDecisions = data.approvedStudents + data.rejectedStudents;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Platform activity at a glance.</Text>

      <View style={styles.grid}>
        <Tile label="Total Users" value={data.totals.users} />
        <Tile label="Models" value={data.totals.models} />
        <Tile label="Instructors" value={data.totals.instructors} />
        <Tile label="Brands" value={data.totals.brands} />
        <Tile label="Open Castings" value={data.openCastings} />
        <Tile label="Conversations" value={data.conversations} />
      </View>

      <Text style={styles.sectionLabel}>Signups — Last 7 Days</Text>
      <View style={styles.card}>
        <SignupsChart data={data.signupsLast7Days} />
      </View>

      <Text style={styles.sectionLabel}>Pending Review</Text>
      <View style={styles.grid}>
        <Tile label="Instructor Applications" value={data.pendingInstructorApplications} color={colors.gold} />
        <Tile label="Student Profiles" value={data.pendingStudentReviews} color={colors.gold} />
      </View>

      <Text style={styles.sectionLabel}>Instructor Decisions</Text>
      <View style={styles.card}>
        <ProgressRow label="Approved" value={data.approvedInstructors} total={totalInstructorDecisions} color={colors.success} />
        <ProgressRow label="Rejected" value={data.rejectedInstructors} total={totalInstructorDecisions} color={colors.danger} />
      </View>

      <Text style={styles.sectionLabel}>Student Decisions</Text>
      <View style={styles.card}>
        <ProgressRow label="Approved" value={data.approvedStudents} total={totalStudentDecisions} color={colors.success} />
        <ProgressRow label="Rejected" value={data.rejectedStudents} total={totalStudentDecisions} color={colors.danger} />
      </View>

      <Text style={styles.sectionLabel}>L&amp;C Academy</Text>
      <View style={styles.grid}>
        <Tile label="Courses" value={data.courses.total} />
        <Tile label="Published" value={data.courses.published} />
        <Tile label="Enrollments" value={data.enrollments.total} />
        <Tile label="Paid" value={data.enrollments.paid} color={colors.success} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  tile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tileValue: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary },
  tileLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartCount: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.text, marginBottom: 4 },
  chartBarTrack: { width: 18, flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  chartLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, marginTop: 6 },
  progressRow: { marginBottom: spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  progressValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text },
  progressTrack: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});

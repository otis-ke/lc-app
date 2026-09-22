import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { collection, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import { PLATFORM_COMMISSION_RATE } from '../../types';

interface Stats {
  users: number;
  models: number;
  instructors: number;
  brands: number;
  bookings: number;
  openCastings: number;
  grossRevenue: number;
  platformCommission: number;
  instructorPayouts: number;
}

async function countOf(name: string): Promise<number> {
  const snap = await getCountFromServer(collection(db, name));
  return snap.data().count;
}

export default function AdminOverviewScreen() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [users, models, instructors, brands, openCastings, bookingsSnap] = await Promise.all([
          countOf('app_users'),
          countOf('app_model_profiles'),
          countOf('app_instructor_profiles'),
          countOf('app_brand_profiles'),
          countOf('castings'),
          getDocs(collection(db, 'bookings')),
        ]);

        let grossRevenue = 0;
        let platformCommission = 0;
        let instructorPayouts = 0;
        bookingsSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.booking_status === 'confirmed' || data.booking_status === 'completed') {
            grossRevenue += data.price ?? 0;
            platformCommission += data.commission_amount ?? 0;
            instructorPayouts += data.instructor_earning ?? 0;
          }
        });

        setStats({
          users,
          models,
          instructors,
          brands,
          bookings: bookingsSnap.size,
          openCastings,
          grossRevenue,
          platformCommission,
          instructorPayouts,
        });
      } catch {
        setStats({ users: 0, models: 0, instructors: 0, brands: 0, bookings: 0, openCastings: 0, grossRevenue: 0, platformCommission: 0, instructorPayouts: 0 });
      }
    })();
  }, []);

  if (!stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Business Overview</Text>

      <View style={styles.grid}>
        <Tile label="Total Users" value={stats.users} />
        <Tile label="Models" value={stats.models} />
        <Tile label="Instructors" value={stats.instructors} />
        <Tile label="Brands" value={stats.brands} />
        <Tile label="Bookings" value={stats.bookings} />
        <Tile label="Open Castings" value={stats.openCastings} />
      </View>

      <Text style={styles.sectionLabel}>Revenue (confirmed &amp; completed bookings)</Text>
      <View style={styles.revenueCard}>
        <RevenueRow label="Gross booking value" value={stats.grossRevenue} highlight />
        <RevenueRow label={`L&C commission (${PLATFORM_COMMISSION_RATE * 100}%)`} value={stats.platformCommission} />
        <RevenueRow label="Instructor payouts (80%)" value={stats.instructorPayouts} />
      </View>
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function RevenueRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.revenueRow}>
      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={[styles.revenueValue, highlight && { color: colors.primary }]}>KSh {value.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
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
  tileLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  revenueCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  revenueLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  revenueValue: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
});

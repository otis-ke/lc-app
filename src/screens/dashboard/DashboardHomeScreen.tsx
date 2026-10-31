import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { RadioGroup } from '../../components/FormFields';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { countUnreadNotifications } from '../../lib/notifications';
import { fetchPendingInstructorApplications } from '../../lib/instructors';
import { fetchAllStudents } from '../../lib/finance';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { AccountType } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface DashCard {
  icon: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function DashboardCard({ icon, title, subtitle, onPress }: DashCard) {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.cardIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'Model', value: 'model' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Brand / Client', value: 'brand' },
];

export default function DashboardHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile, isAdmin, isSuperAdmin, setAccountType } = useAuth();
  const [pickerValue, setPickerValue] = useState(ACCOUNT_TYPE_OPTIONS[0].label);
  const [saving, setSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const shownApprovalPrompt = useRef(false);

  useEffect(() => {
    if (session) countUnreadNotifications(session.uid).then(setUnreadCount).catch(() => {});
  }, [session]);

  // Pop up once per app open when admin/super admin has something waiting —
  // covers both "approve an instructor" and "approve/enroll a student"
  // without needing to already be inside the Approvals screen to notice.
  useEffect(() => {
    if (!isAdmin || shownApprovalPrompt.current) return;
    shownApprovalPrompt.current = true;
    (async () => {
      try {
        const [pendingApps, students] = await Promise.all([
          fetchPendingInstructorApplications(),
          fetchAllStudents(),
        ]);
        const unverifiedStudents = students.filter((s) => s.review_status === 'pending');
        if (pendingApps.length === 0 && unverifiedStudents.length === 0) return;

        const parts: string[] = [];
        if (pendingApps.length > 0) parts.push(`${pendingApps.length} instructor application${pendingApps.length === 1 ? '' : 's'}`);
        if (unverifiedStudents.length > 0) parts.push(`${unverifiedStudents.length} student${unverifiedStudents.length === 1 ? '' : 's'}`);

        Alert.alert('Pending Approvals', `${parts.join(' and ')} awaiting your review.`, [
          ...(pendingApps.length > 0 ? [{ text: 'Review Instructors', onPress: () => navigation.navigate('AdminApprovals') }] : []),
          ...(unverifiedStudents.length > 0 ? [{ text: 'Review Students', onPress: () => navigation.navigate('AdminStudents') }] : []),
          { text: 'Later', style: 'cancel' as const },
        ]);
      } catch {
        // silent — this is a convenience nudge, not a required flow
      }
    })();
  }, [isAdmin]);

  if (!session) {
    return (
      <Screen>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Card style={styles.introCard}>
          <Ionicons name="grid-outline" size={32} color={colors.primary} />
          <Text style={styles.introTitle}>Sign in to see your dashboard</Text>
          <Text style={styles.introText}>
            Models, instructors and brands each get their own dashboard here — bookings, earnings,
            castings, messages and more.
          </Text>
        </Card>
      </Screen>
    );
  }

  const sharedCards: DashCard[] = [
    { icon: 'chatbubbles-outline', title: 'Messages', subtitle: 'Conversations with instructors, models and brands', onPress: () => navigation.navigate('Conversations') },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: unreadCount > 0 ? `${unreadCount} unread` : 'Bookings, applications and updates',
      onPress: () => navigation.navigate('Notifications'),
    },
    { icon: 'ribbon-outline', title: 'Verify a Certificate', subtitle: 'Check a certificate number', onPress: () => navigation.navigate('VerifyCertificate') },
  ];

  const adminCards: DashCard[] = [
    { icon: 'stats-chart-outline', title: 'Business Overview', subtitle: 'Users, bookings, revenue & commission', onPress: () => navigation.navigate('AdminOverview') },
    { icon: 'checkmark-done-outline', title: 'Approvals', subtitle: 'Pending instructor applications', onPress: () => navigation.navigate('AdminApprovals') },
    { icon: 'cash-outline', title: 'Withdrawals', subtitle: 'Instructor payout requests', onPress: () => navigation.navigate('AdminWithdrawals') },
    { icon: 'people-outline', title: 'Students', subtitle: 'Balances & payment status', onPress: () => navigation.navigate('AdminStudents') },
    { icon: 'chatbubbles-outline', title: 'Conversations', subtitle: 'Oversee student ↔ instructor chats', onPress: () => navigation.navigate('AdminChats') },
    { icon: 'school-outline', title: 'Courses', subtitle: 'Create courses & lesson videos', onPress: () => navigation.navigate('AdminCourses') },
    { icon: 'analytics-outline', title: 'Analytics', subtitle: 'Signups, approvals, courses & finance', onPress: () => navigation.navigate('AdminAnalytics') },
    { icon: 'document-text-outline', title: 'Audit Log', subtitle: 'Every approve/reject decision made', onPress: () => navigation.navigate('AdminAuditLog') },
  ];

  if (isSuperAdmin) {
    adminCards.push({
      icon: 'shield-checkmark-outline',
      title: 'Super Admin',
      subtitle: 'Every privilege & platform-wide finance',
      onPress: () => navigation.navigate('SuperAdmin'),
    });
  }

  let roleCards: DashCard[] = [];
  let roleTitle = '';
  if (profile?.account_type === 'model') {
    roleTitle = 'Model Dashboard';
    roleCards = [
      { icon: 'person-circle-outline', title: 'My Portfolio', subtitle: 'Photos, measurements, categories & bio', onPress: () => navigation.navigate('MyPortfolio') },
      { icon: 'calendar-outline', title: 'My Bookings', subtitle: 'Training sessions you’ve requested', onPress: () => navigation.navigate('MyBookings') },
      { icon: 'trending-up-outline', title: 'My Development', subtitle: 'Catwalk, posing, confidence & more', onPress: () => navigation.navigate('DevelopmentTracker') },
      { icon: 'play-circle-outline', title: 'L&C Academy', subtitle: 'Video courses from our instructors', onPress: () => navigation.navigate('Courses') },
      { icon: 'school-outline', title: 'My Certificates', subtitle: 'Completed L&C courses', onPress: () => navigation.navigate('MyCertificates') },
      { icon: 'briefcase-outline', title: 'My Casting Applications', subtitle: 'Jobs you’ve applied to', onPress: () => navigation.navigate('MyCastingApplications') },
      { icon: 'megaphone-outline', title: 'Browse Castings', subtitle: 'Find modeling jobs', onPress: () => navigation.navigate('CastingsBoard') },
      { icon: 'wallet-outline', title: 'My Finance', subtitle: 'Balance & payment status', onPress: () => navigation.navigate('MyFinance') },
    ];
  } else if (profile?.account_type === 'instructor') {
    roleTitle = 'Instructor Dashboard';
    roleCards = [
      { icon: 'person-circle-outline', title: 'My Profile', subtitle: 'Bio, specialties, price & photos', onPress: () => navigation.navigate('InstructorProfileEdit') },
      { icon: 'calendar-outline', title: 'Bookings', subtitle: 'Accept, reject & complete sessions', onPress: () => navigation.navigate('InstructorDashboardBookings') },
      { icon: 'time-outline', title: 'Availability', subtitle: 'Your weekly training slots', onPress: () => navigation.navigate('InstructorAvailability') },
      { icon: 'wallet-outline', title: 'Earnings', subtitle: 'Your 80% share & withdrawals', onPress: () => navigation.navigate('InstructorEarnings') },
    ];
  } else if (profile?.account_type === 'brand') {
    roleTitle = 'Brand Dashboard';
    roleCards = [
      { icon: 'business-outline', title: 'Company Profile', subtitle: 'Your brand details', onPress: () => navigation.navigate('BrandProfile') },
      { icon: 'add-circle-outline', title: 'Post a Casting', subtitle: 'Advertise a job to models', onPress: () => navigation.navigate('PostCasting') },
      { icon: 'list-outline', title: 'My Castings', subtitle: 'Manage postings & applicants', onPress: () => navigation.navigate('MyCastings') },
    ];
  }

  return (
    <Screen>
      {/* headerTitle/sectionLabel sit directly on Screen's background, which
          stays pinned to the dark default (see Screen.tsx) — content inside
          a <Card> below reacts safely since its own background reacts too. */}
      <Text style={styles.headerTitle}>{roleTitle || 'Dashboard'}</Text>

      {!profile?.account_type ? (
        <Card style={styles.introCard}>
          <Ionicons name="sparkles-outline" size={28} color={colors.gold} />
          <Text style={styles.introTitle}>Unlock your dashboard</Text>
          <Text style={styles.introText}>
            Tell us who you are to unlock a portfolio, bookings, castings or a brand profile.
          </Text>
          <RadioGroup
            label="I am a..."
            value={pickerValue}
            options={ACCOUNT_TYPE_OPTIONS.map((o) => o.label)}
            onChange={setPickerValue}
          />
          <Button
            label="Continue"
            loading={saving}
            onPress={async () => {
              const value = ACCOUNT_TYPE_OPTIONS.find((o) => o.label === pickerValue)?.value;
              if (!value) return;
              setSaving(true);
              await setAccountType(value);
              setSaving(false);
            }}
          />
        </Card>
      ) : (
        <View style={{ gap: 10, marginBottom: spacing.lg }}>
          {roleCards.map((c) => (
            <DashboardCard key={c.title} {...c} />
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>General</Text>
      <View style={{ gap: 10, marginBottom: spacing.lg }}>
        {sharedCards.map((c) => (
          <DashboardCard key={c.title} {...c} />
        ))}
      </View>

      {isAdmin ? (
        <>
          <Text style={styles.sectionLabel}>Admin</Text>
          <View style={{ gap: 10 }}>
            {adminCards.map((c) => (
              <DashboardCard key={c.title} {...c} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTitle: { ...typography.pageTitle, marginBottom: spacing.lg },
  introCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs, marginBottom: spacing.lg },
  introTitle: { ...typography.dialogTitle, marginTop: 6 },
  introText: { ...typography.intro, textAlign: 'center', marginBottom: 4 },
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
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  cardSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
});

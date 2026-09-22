import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchInstructorSelfProfile } from '../../lib/instructors';
import { fetchBookingsForInstructor, createBooking } from '../../lib/bookings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AppInstructorProfile, AvailabilitySlot, Booking, InstructorMode } from '../../types';
import { PLATFORM_COMMISSION_RATE } from '../../types';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;
type Rt = RouteProp<ConnectStackParamList, 'SelectSlot'>;

// Same 8 disciplines used across the Connect flow (see BookTrainingScreen/
// ConnectHomeScreen) — kept as its own local copy to match that existing
// per-screen pattern rather than introducing a new shared constants module.
const TRAINING_TYPES = [
  'Catwalk Training',
  'Runway Coaching',
  'Pageantry Training',
  'Posing Classes',
  'Grooming & Etiquette',
  'Confidence Building',
  'Kids Modeling',
  'Portfolio & Personal Branding',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nextNDates(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function SelectSlotScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { instructorUid, instructorName } = route.params;
  const { session, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState<AppInstructorProfile | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [course, setCourse] = useState(TRAINING_TYPES[0]);
  const [mode, setMode] = useState<InstructorMode>('online');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profileData, bookings] = await Promise.all([
          fetchInstructorSelfProfile(instructorUid),
          fetchBookingsForInstructor(instructorUid),
        ]);
        setInstructor(profileData);
        if (profileData) setMode(profileData.mode === 'both' ? 'online' : profileData.mode);
        setExistingBookings(bookings.filter((b) => b.booking_status === 'requested' || b.booking_status === 'confirmed'));
      } catch {
        setInstructor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [instructorUid]);

  const dateOptions = useMemo(() => nextNDates(21), []);

  const availableSlotsForDate = useMemo(() => {
    if (!selectedDate || !instructor) return [];
    const dow = selectedDate.getDay();
    const dateKey = toDateKey(selectedDate);
    const bookedTimes = new Set(existingBookings.filter((b) => b.date === dateKey).map((b) => b.time_slot));
    return instructor.availability.filter((s) => s.day_of_week === dow && !bookedTimes.has(s.start));
  }, [selectedDate, instructor, existingBookings]);

  const price = instructor?.price_per_session ?? 0;
  const commission = Math.round(price * PLATFORM_COMMISSION_RATE);
  const instructorEarning = price - commission;

  async function handleConfirm() {
    if (!session || !profile) return;
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Pick a date and time first');
      return;
    }
    setSubmitting(true);
    try {
      const bookingId = await createBooking({
        model_uid: session.uid,
        model_name: profile.full_name ?? profile.email,
        instructor_uid: instructorUid,
        instructor_name: instructorName,
        course,
        mode,
        date: toDateKey(selectedDate),
        time_slot: selectedSlot.start,
        price,
      });
      navigation.replace('BookingConfirmed', {
        bookingId,
        course,
        date: toDateKey(selectedDate),
        timeSlot: selectedSlot.start,
        price,
      });
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Card style={styles.gateCard}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
          <Text style={styles.gateTitle}>Sign in to book</Text>
          <Text style={styles.gateText}>Create a model account to book training sessions.</Text>
          <Button
            label="Sign In / Create Account"
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({ name: 'ProfileTab', params: { screen: 'Login' } })
              )
            }
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </Screen>
    );
  }

  if (!instructor || instructor.availability.length === 0) {
    return (
      <Screen>
        <Card style={styles.gateCard}>
          <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
          <Text style={styles.gateTitle}>No availability set</Text>
          <Text style={styles.gateText}>
            {instructorName} hasn't published any open training slots yet — check back soon.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Book {instructorName}</Text>
      <Text style={styles.price}>KSh {price.toLocaleString()} per session</Text>

      <SelectField label="Course" value={course} onChange={setCourse} options={TRAINING_TYPES} />

      {instructor.mode === 'both' ? (
        <SelectField
          label="Mode"
          value={mode === 'online' ? 'Online' : 'In Person'}
          onChange={(v) => setMode(v === 'Online' ? 'online' : 'in_person')}
          options={['Online', 'In Person']}
        />
      ) : null}

      <SectionTitle title="Pick a Date" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {dateOptions.map((d) => {
          const hasAvailability = instructor.availability.some((s) => s.day_of_week === d.getDay());
          const active = selectedDate && toDateKey(selectedDate) === toDateKey(d);
          return (
            <Pressable
              key={toDateKey(d)}
              disabled={!hasAvailability}
              style={[styles.dateChip, active && styles.dateChipActive, !hasAvailability && styles.dateChipDisabled]}
              onPress={() => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
            >
              <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>{DAY_NAMES[d.getDay()]}</Text>
              <Text style={[styles.dateChipNum, active && styles.dateChipTextActive]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedDate ? (
        <>
          <SectionTitle title="Pick a Time" style={{ marginTop: spacing.lg }} />
          {availableSlotsForDate.length === 0 ? (
            <Text style={styles.empty}>No open slots on this day — try another date.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {availableSlotsForDate.map((s) => {
                const active = selectedSlot?.start === s.start;
                return (
                  <Pressable
                    key={s.start}
                    style={[styles.slotChip, active && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(s)}
                  >
                    <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                      {s.start} – {s.end}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={styles.breakdownTitle}>Price Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Session price</Text>
          <Text style={styles.breakdownValue}>KSh {price.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>L&amp;C platform fee (20%)</Text>
          <Text style={styles.breakdownValue}>KSh {commission.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabelBold}>Instructor receives (80%)</Text>
          <Text style={styles.breakdownValueBold}>KSh {instructorEarning.toLocaleString()}</Text>
        </View>
      </Card>

      <Button
        label="Request Booking"
        onPress={handleConfirm}
        loading={submitting}
        disabled={!selectedDate || !selectedSlot}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle },
  price: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary, marginBottom: spacing.md },
  dateChip: {
    width: 52,
    height: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipDisabled: { opacity: 0.35 },
  dateChipDay: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.textMuted },
  dateChipNum: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text, marginTop: 2 },
  dateChipTextActive: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotChipText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  slotChipTextActive: { color: '#fff' },
  empty: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  breakdownTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  breakdownValue: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  breakdownLabelBold: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  breakdownValueBold: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.success },
  gateCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  gateTitle: { ...typography.dialogTitle },
  gateText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});

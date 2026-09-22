import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchBookingsForInstructor, updateBookingStatus } from '../../lib/bookings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Booking } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function InstructorDashboardBookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchBookingsForInstructor(session.uid);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(b: Booking, status: 'confirmed' | 'rejected' | 'completed') {
    setBusyId(b.id);
    try {
      await updateBookingStatus(b, status);
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

  const requested = bookings.filter((b) => b.booking_status === 'requested');
  const upcoming = bookings.filter((b) => b.booking_status === 'confirmed');
  const past = bookings.filter((b) => ['completed', 'cancelled', 'rejected'].includes(b.booking_status));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>Bookings</Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No bookings yet.</Text>
        </View>
      ) : (
        <>
          {requested.length > 0 ? (
            <Section title="Needs Your Response">
              {requested.map((b) => (
                <View key={b.id} style={styles.card}>
                  <BookingInfo b={b} />
                  <View style={styles.actionRow}>
                    <Button
                      label="Accept"
                      onPress={() => act(b, 'confirmed')}
                      loading={busyId === b.id}
                      fullWidth={false}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Decline"
                      variant="outline"
                      onPress={() => act(b, 'rejected')}
                      loading={busyId === b.id}
                      fullWidth={false}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ))}
            </Section>
          ) : null}

          {upcoming.length > 0 ? (
            <Section title="Upcoming">
              {upcoming.map((b) => (
                <View key={b.id} style={styles.card}>
                  <BookingInfo b={b} />
                  <Button
                    label="Message Model"
                    variant="ghost"
                    onPress={() => navigation.navigate('Chat', { otherUid: b.model_uid, otherName: b.model_name })}
                    style={{ marginTop: spacing.sm }}
                  />
                  <Button
                    label="Mark Completed"
                    variant="gold"
                    onPress={() => act(b, 'completed')}
                    loading={busyId === b.id}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              ))}
            </Section>
          ) : null}

          {past.length > 0 ? (
            <Section title="History">
              {past.map((b) => (
                <View key={b.id} style={[styles.card, { opacity: 0.75 }]}>
                  <BookingInfo b={b} />
                  {b.booking_status === 'completed' ? (
                    <View style={styles.historyActions}>
                      <Button
                        label="Update Student Progress"
                        variant="outline"
                        onPress={() => navigation.navigate('InstructorStudentDevelopment', { modelUid: b.model_uid, modelName: b.model_name })}
                      />
                      <Button
                        label="Issue Certificate"
                        variant="outline"
                        onPress={() =>
                          navigation.navigate('IssueCertificate', {
                            bookingId: b.id,
                            modelUid: b.model_uid,
                            modelName: b.model_name,
                            course: b.course,
                            instructorName: b.instructor_name,
                          })
                        }
                      />
                      <Button
                        label="Rate this Model"
                        variant="outline"
                        onPress={() =>
                          navigation.navigate('LeaveReview', {
                            bookingId: b.id,
                            targetType: 'model',
                            targetUid: b.model_uid,
                            targetName: b.model_name,
                          })
                        }
                      />
                    </View>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function BookingInfo({ b }: { b: Booking }) {
  return (
    <>
      <Text style={styles.course}>{b.course}</Text>
      <Text style={styles.model}>with {b.model_name}</Text>
      <Text style={styles.meta}>
        {b.date} · {b.time_slot} · {b.mode === 'online' ? 'Online' : 'In Person'}
      </Text>
      <Text style={styles.earning}>You earn KSh {b.instructor_earning.toLocaleString()} (of KSh {b.price.toLocaleString()})</Text>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
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
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  course: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text },
  model: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.primary, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  earning: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.success, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  historyActions: { gap: 8, marginTop: spacing.sm },
});

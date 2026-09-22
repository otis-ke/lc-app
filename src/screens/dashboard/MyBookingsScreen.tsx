import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchBookingsForModel, updateBookingStatus } from '../../lib/bookings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Booking, BookingStatus } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const STATUS_STYLE: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  requested: { bg: '#fff4d6', text: '#8a6d1d', label: 'Awaiting Confirmation' },
  confirmed: { bg: '#e2f3ff', text: '#1c5f8a', label: 'Confirmed' },
  completed: { bg: '#e8f6ee', text: colors.success, label: 'Completed' },
  cancelled: { bg: '#f1f0ee', text: colors.textMuted, label: 'Cancelled' },
  rejected: { bg: '#fbeaea', text: colors.dangerDark, label: 'Declined' },
};

export default function MyBookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchBookingsForModel(session.uid);
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

  async function handleCancel(b: Booking) {
    await updateBookingStatus(b, 'cancelled');
    load();
  }

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>My Bookings</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No bookings yet — find an instructor on the Connect tab.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {bookings.map((b) => {
            const status = STATUS_STYLE[b.booking_status];
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.course}>{b.course}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.instructor}>with {b.instructor_name}</Text>
                <Text style={styles.meta}>
                  {b.date} · {b.time_slot} · {b.mode === 'online' ? 'Online' : 'In Person'}
                </Text>
                <Text style={styles.price}>KSh {b.price.toLocaleString()}</Text>

                <Button
                  label="Message Instructor"
                  variant="ghost"
                  onPress={() => navigation.navigate('Chat', { otherUid: b.instructor_uid, otherName: b.instructor_name })}
                  style={{ marginTop: spacing.sm }}
                />
                {b.booking_status === 'requested' ? (
                  <Button label="Cancel Request" variant="outline" onPress={() => handleCancel(b)} style={{ marginTop: spacing.sm }} />
                ) : null}
                {b.booking_status === 'completed' ? (
                  <Button
                    label="Leave a Review"
                    variant="gold"
                    onPress={() =>
                      navigation.navigate('LeaveReview', {
                        bookingId: b.id,
                        targetType: 'instructor',
                        targetUid: b.instructor_uid,
                        targetName: b.instructor_name,
                      })
                    }
                    style={{ marginTop: spacing.sm }}
                  />
                ) : null}
              </View>
            );
          })}
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
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  course: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text, flex: 1 },
  statusPill: { borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  instructor: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.primary, marginTop: 4 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  price: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, marginTop: 6 },
});

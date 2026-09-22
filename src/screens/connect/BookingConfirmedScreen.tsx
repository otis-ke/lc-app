import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ConnectStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import { PLATFORM_COMMISSION_RATE } from '../../types';

type Nav = NativeStackNavigationProp<ConnectStackParamList>;
type Rt = RouteProp<ConnectStackParamList, 'BookingConfirmed'>;

export default function BookingConfirmedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { course, date, timeSlot, price } = route.params;
  const commission = Math.round(price * PLATFORM_COMMISSION_RATE);
  const instructorEarning = price - commission;

  return (
    <Screen>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      <Text style={styles.title}>Booking Requested!</Text>
      <Text style={styles.subtitle}>
        Your request has been sent — you'll get a notification as soon as the instructor confirms.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Row label="Course" value={course} />
        <Row label="Date" value={date} />
        <Row label="Time" value={timeSlot} />
        <Row label="Price" value={`KSh ${price.toLocaleString()}`} />
        <Row label="Instructor earns (80%)" value={`KSh ${instructorEarning.toLocaleString()}`} />
      </Card>

      <Button
        label="View My Bookings"
        onPress={() =>
          navigation.getParent()?.dispatch(
            CommonActions.navigate({ name: 'DashboardTab', params: { screen: 'MyBookings' } })
          )
        }
        style={{ marginTop: spacing.xl }}
      />
      <Button label="Done" variant="outline" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  title: { ...typography.pageTitle, textAlign: 'center' },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  rowValue: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
});

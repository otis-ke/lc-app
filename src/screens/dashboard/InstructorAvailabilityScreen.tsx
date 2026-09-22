import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { Card, SectionTitle } from '../../components/Card';
import { TextField, SelectField } from '../../components/FormFields';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchInstructorSelfProfile, saveInstructorAvailability } from '../../lib/instructors';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { AvailabilitySlot } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorAvailabilityScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [day, setDay] = useState(DAYS[1]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('11:00');

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const p = await fetchInstructorSelfProfile(session.uid);
        setSlots(p?.availability ?? []);
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  function addSlot() {
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      Alert.alert('Use 24-hour time', 'Enter times like 09:00 or 17:30.');
      return;
    }
    const day_of_week = DAYS.indexOf(day);
    setSlots((prev) => [...prev, { day_of_week, start, end }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      await saveInstructorAvailability(session.uid, slots);
      Alert.alert('Saved', 'Your availability has been updated.');
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const sorted = [...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.start.localeCompare(b.start));

  return (
    <Screen>
      <Text style={styles.title}>Weekly Availability</Text>
      <Text style={styles.subtitle}>
        Add the recurring time blocks you're free to train — models will only see these open slots when
        booking.
      </Text>

      <SectionTitle title="Your Slots" />
      {sorted.length === 0 ? (
        <Text style={styles.empty}>No slots yet — add one below.</Text>
      ) : (
        <View style={{ gap: 8, marginBottom: spacing.lg }}>
          {sorted.map((slot, i) => (
            <View key={`${slot.day_of_week}-${slot.start}-${i}`} style={styles.slotRow}>
              <Text style={styles.slotText}>
                {DAYS[slot.day_of_week]} · {slot.start} – {slot.end}
              </Text>
              <Pressable onPress={() => removeSlot(slots.indexOf(slot))} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Card>
        <SelectField label="Day" value={day} onChange={setDay} options={DAYS} />
        <View style={styles.timeRow}>
          <TextField label="Start (HH:mm)" value={start} onChangeText={setStart} placeholder="09:00" style={{ flex: 1 }} />
          <TextField label="End (HH:mm)" value={end} onChangeText={setEnd} placeholder="11:00" style={{ flex: 1 }} />
        </View>
        <Button label="Add Slot" variant="outline" onPress={addSlot} />
      </Card>

      <Button label="Save Availability" onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  empty: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginBottom: spacing.lg },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  slotText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
});

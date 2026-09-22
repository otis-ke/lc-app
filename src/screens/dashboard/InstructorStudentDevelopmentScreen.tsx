import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { fetchModelProfileById, updateModelDevelopment } from '../../lib/models';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import { EMPTY_DEVELOPMENT } from '../../types';
import type { DashboardStackParamList } from '../../navigation/types';
import type { DevelopmentProgress } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'InstructorStudentDevelopment'>;

const FIELDS: { key: keyof DevelopmentProgress; label: string }[] = [
  { key: 'catwalk', label: 'Catwalk' },
  { key: 'posing', label: 'Posing' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'grooming', label: 'Grooming' },
  { key: 'pageantry', label: 'Pageantry' },
  { key: 'commercial_modeling', label: 'Commercial Modeling' },
];

const STEP = 10;

export default function InstructorStudentDevelopmentScreen() {
  const route = useRoute<Rt>();
  const { modelUid, modelName } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [development, setDevelopment] = useState<DevelopmentProgress>(EMPTY_DEVELOPMENT);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchModelProfileById(modelUid);
        if (p) setDevelopment(p.development);
      } catch {
        // keep the default/empty development state
      } finally {
        setLoading(false);
      }
    })();
  }, [modelUid]);

  function adjust(key: keyof DevelopmentProgress, delta: number) {
    setDevelopment((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, prev[key] + delta)) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateModelDevelopment(modelUid, development);
      Alert.alert('Saved', `${modelName}'s development has been updated.`);
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

  return (
    <Screen>
      <Text style={styles.title}>{modelName}'s Development</Text>
      <Text style={styles.subtitle}>Adjust each skill in steps of {STEP}%.</Text>

      <View style={{ gap: spacing.md }}>
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowLabel}>{f.label}</Text>
              <Text style={styles.rowValue}>{development[f.key]}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${development[f.key]}%` }]} />
            </View>
            <View style={styles.buttonRow}>
              <Button label="-10" variant="outline" fullWidth={false} style={styles.stepBtn} onPress={() => adjust(f.key, -STEP)} />
              <Button label="+10" variant="outline" fullWidth={false} style={styles.stepBtn} onPress={() => adjust(f.key, STEP)} />
            </View>
          </View>
        ))}
      </View>

      <Button label="Save Progress" onPress={handleSave} loading={saving} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  row: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  rowValue: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.primary },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginBottom: spacing.sm },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  stepBtn: { flex: 1 },
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { fetchModelProfileById } from '../../lib/models';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import { EMPTY_DEVELOPMENT } from '../../types';
import type { DashboardStackParamList } from '../../navigation/types';
import type { DevelopmentProgress } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'DevelopmentTracker'>;

const FIELDS: { key: keyof DevelopmentProgress; label: string }[] = [
  { key: 'catwalk', label: 'Catwalk' },
  { key: 'posing', label: 'Posing' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'grooming', label: 'Grooming' },
  { key: 'pageantry', label: 'Pageantry' },
  { key: 'commercial_modeling', label: 'Commercial Modeling' },
];

export default function DevelopmentTrackerScreen() {
  const route = useRoute<Rt>();
  const { session } = useAuth();
  const uid = route.params?.modelUid ?? session?.uid;
  const [loading, setLoading] = useState(true);
  const [development, setDevelopment] = useState<DevelopmentProgress>(EMPTY_DEVELOPMENT);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const p = await fetchModelProfileById(uid);
        if (p) {
          setDevelopment(p.development);
          setHasProfile(true);
        }
      } catch {
        // fall through to the "no profile yet" empty state below
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>My Development</Text>
      <Text style={styles.subtitle}>
        {hasProfile
          ? 'Your instructors update this after each completed session.'
          : 'Create your portfolio first — your instructors will update this as you train.'}
      </Text>

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
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: 6 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  row: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  rowValue: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.primary },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
});

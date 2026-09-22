import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCertificatesForModel } from '../../lib/certificates';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { Certificate } from '../../types';

export default function MyCertificatesScreen() {
  const { session } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    fetchCertificatesForModel(session.uid)
      .then(setCertificates)
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>My Certificates</Text>
      {certificates.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="ribbon-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>Complete a training session to earn your first certificate.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {certificates.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="ribbon" size={22} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.course}>{c.course}</Text>
                <Text style={styles.meta}>Instructor: {c.instructor_name}</Text>
                <Text style={styles.meta}>Completed: {c.completion_date}</Text>
                <Text style={styles.number}>{c.certificate_number}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbf4e4', alignItems: 'center', justifyContent: 'center' },
  course: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  number: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.goldDark, marginTop: 6, letterSpacing: 0.5 },
});

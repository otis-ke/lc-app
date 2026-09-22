import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchOpenCastings } from '../../lib/castings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Casting } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function CastingsBoardScreen() {
  const navigation = useNavigation<Nav>();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchOpenCastings();
      setCastings(data);
    } catch {
      setCastings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>
        Castings <Text style={{ fontFamily: fonts.body }}>&</Text> Jobs
      </Text>
      <Text style={styles.subtitle}>Modeling opportunities posted by brands, photographers &amp; designers.</Text>

      {castings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="megaphone-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No open castings right now — check back soon.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {castings.map((c) => (
            <Pressable key={c.id} style={styles.card} onPress={() => navigation.navigate('CastingDetail', { castingId: c.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{c.category}</Text>
                </View>
              </View>
              <Text style={styles.cardPoster}>{c.posted_by_name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{c.location}</Text>
                {c.date ? (
                  <>
                    <Ionicons name="calendar-outline" size={13} color={colors.textMuted} style={{ marginLeft: 8 }} />
                    <Text style={styles.metaText}>{c.date}</Text>
                  </>
                ) : null}
              </View>
              {c.compensation ? <Text style={styles.compensation}>{c.compensation}</Text> : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text, flex: 1 },
  categoryPill: { backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  categoryPillText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.primary },
  cardPoster: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  metaText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  compensation: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.success, marginTop: 8 },
});

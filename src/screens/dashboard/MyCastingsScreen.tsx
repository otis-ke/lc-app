import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCastingsByPoster, closeCasting } from '../../lib/castings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Casting } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function MyCastingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchCastingsByPoster(session.uid);
      setCastings(data);
    } catch {
      setCastings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClose(id: string) {
    await closeCasting(id);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>My Castings</Text>
      <Button label="Post a New Casting" onPress={() => navigation.navigate('PostCasting')} style={{ marginBottom: spacing.lg }} />

      {castings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="megaphone-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>You haven't posted any castings yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {castings.map((c) => (
            <View key={c.id} style={styles.card}>
              <Pressable onPress={() => navigation.navigate('CastingDetail', { castingId: c.id })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                  <View style={[styles.statusPill, c.status === 'closed' && styles.statusPillClosed]}>
                    <Text style={[styles.statusText, c.status === 'closed' && styles.statusTextClosed]}>{c.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{c.category} · {c.location}</Text>
              </Pressable>
              <View style={styles.actionRow}>
                <Button
                  label="View Applicants"
                  variant="outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('CastingApplicants', { castingId: c.id, castingTitle: c.title })}
                />
                {c.status === 'open' ? (
                  <Button
                    label="Close"
                    variant="ghost"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    onPress={() => Alert.alert('Close casting?', 'Models will no longer be able to apply.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Close', style: 'destructive', onPress: () => handleClose(c.id) },
                    ])}
                  />
                ) : null}
              </View>
            </View>
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
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text, flex: 1 },
  statusPill: { backgroundColor: '#e8f6ee', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusPillClosed: { backgroundColor: colors.surfaceAlt },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.success, textTransform: 'capitalize' },
  statusTextClosed: { color: colors.textMuted },
  cardMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
});

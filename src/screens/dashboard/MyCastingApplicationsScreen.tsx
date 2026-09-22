import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApplicationsForModel } from '../../lib/castings';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { CastingApplication, CastingApplicationStatus } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

const STATUS_COLOR: Record<CastingApplicationStatus, string> = {
  submitted: colors.textMuted,
  shortlisted: colors.secondary,
  accepted: colors.success,
  rejected: colors.danger,
};

export default function MyCastingApplicationsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [applications, setApplications] = useState<CastingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchApplicationsForModel(session.uid);
      setApplications(data);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>My Casting Applications</Text>

      {applications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="briefcase-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>You haven't applied to any castings yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {applications.map((app) => (
            <Pressable
              key={app.id}
              style={styles.card}
              onPress={() => navigation.navigate('CastingDetail', { castingId: app.casting_id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title2} numberOfLines={1}>{app.casting_title}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[app.status] }]}>{app.status}</Text>
              </View>
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
  title: { ...typography.pageTitle, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title2: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, flex: 1 },
  status: { fontFamily: fonts.bodySemiBold, fontSize: 12, textTransform: 'capitalize' },
});

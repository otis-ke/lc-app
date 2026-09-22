import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { fetchAllCourses } from '../../lib/courses';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Course } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function AdminCoursesScreen() {
  const navigation = useNavigation<Nav>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllCourses();
      setCourses(data);
    } catch {
      setCourses([]);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Courses</Text>
      <Button label="New Course" onPress={() => navigation.navigate('AdminCourseEditor', undefined)} style={{ marginBottom: spacing.lg }} />

      {courses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="school-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No courses yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {courses.map((c) => (
            <Pressable key={c.id} style={styles.card} onPress={() => navigation.navigate('AdminCourseEditor', { courseId: c.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.title}</Text>
                <Text style={styles.meta}>
                  {c.instructor_name ?? 'No instructor assigned'} · {c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={[styles.statusPill, c.status === 'published' ? styles.statusPublished : styles.statusDraft]}>
                <Text style={[styles.statusText, { color: c.status === 'published' ? colors.success : colors.textMuted }]}>
                  {c.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
  title: { ...typography.pageTitle, marginBottom: spacing.md },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusPill: { borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10 },
  statusPublished: { backgroundColor: colors.success + '1a' },
  statusDraft: { backgroundColor: colors.surfaceAlt },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, textTransform: 'capitalize' },
});

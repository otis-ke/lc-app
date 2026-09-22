import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeadingText } from '../../components/HeadingText';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPublishedCourses, fetchEnrollmentsForStudent } from '../../lib/courses';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Course, CourseEnrollment } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export default function CoursesScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [courseList, enrollmentList] = await Promise.all([
        fetchPublishedCourses(),
        session ? fetchEnrollmentsForStudent(session.uid) : Promise.resolve([]),
      ]);
      setCourses(courseList);
      setEnrollments(enrollmentList);
    } catch {
      setCourses([]);
      setEnrollments([]);
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
      <HeadingText style={styles.title}>L&C Academy</HeadingText>
      <Text style={styles.subtitle}>Video courses taught by our instructors.</Text>

      {courses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="school-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>No courses published yet — check back soon.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {courses.map((c) => {
            const enrollment = enrollments.find((e) => e.course_id === c.id);
            const unlocked = !!enrollment?.paid;
            return (
              <Pressable
                key={c.id}
                style={styles.card}
                onPress={() => navigation.navigate('CourseDetail', { courseId: c.id, courseTitle: c.title })}
              >
                {c.cover_image ? (
                  <Image source={{ uri: c.cover_image }} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Ionicons name="videocam-outline" size={26} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                  {c.instructor_name ? <Text style={styles.cardMeta}>Taught by {c.instructor_name}</Text> : null}
                  <Text style={styles.cardMeta}>{c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>KSh {c.price.toLocaleString()}</Text>
                    <View style={[styles.statusPill, unlocked ? styles.statusUnlocked : styles.statusLocked]}>
                      <Ionicons name={unlocked ? 'lock-open-outline' : 'lock-closed-outline'} size={12} color={unlocked ? colors.success : colors.textMuted} />
                      <Text style={[styles.statusText, { color: unlocked ? colors.success : colors.textMuted }]}>
                        {unlocked ? 'Unlocked' : enrollment ? 'Payment pending' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
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
  title: { ...typography.pageTitle, marginBottom: 4 },
  subtitle: { ...typography.intro, marginBottom: spacing.lg },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 140, backgroundColor: colors.surfaceAlt },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md, gap: 3 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text },
  cardMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10 },
  statusUnlocked: { backgroundColor: colors.success + '1a' },
  statusLocked: { backgroundColor: colors.surfaceAlt },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5 },
});

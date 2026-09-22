import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCourse, fetchLessons, fetchEnrollmentForCourse } from '../../lib/courses';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { Course, CourseEnrollment, Lesson } from '../../types';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;
type Rt = RouteProp<DashboardStackParamList, 'CourseDetail'>;

export default function CourseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { session } = useAuth();
  const { courseId } = route.params;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, l, e] = await Promise.all([
          fetchCourse(courseId),
          fetchLessons(courseId),
          session ? fetchEnrollmentForCourse(courseId, session.uid) : Promise.resolve(null),
        ]);
        setCourse(c);
        setLessons(l);
        setEnrollment(e);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, session]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.textMuted} />
        <Text style={styles.emptyText}>Course not found.</Text>
      </View>
    );
  }

  const unlocked = !!enrollment?.paid;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{course.title}</Text>
      {course.instructor_name ? <Text style={styles.instructor}>Taught by {course.instructor_name}</Text> : null}
      {course.description ? <Text style={styles.description}>{course.description}</Text> : null}

      {!unlocked ? (
        <View style={styles.lockBanner}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
          <Text style={styles.lockText}>
            {enrollment
              ? "You're enrolled — pay the school directly and admin will unlock your lessons."
              : `Pay KSh ${course.price.toLocaleString()} to the school and ask admin to enroll you to unlock this course.`}
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Lessons</Text>
      {lessons.length === 0 ? (
        <Text style={styles.emptyText}>No lessons added yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {lessons.map((lesson, idx) => (
            <Pressable
              key={lesson.id}
              style={[styles.lessonRow, !unlocked && styles.lessonRowLocked]}
              disabled={!unlocked}
              onPress={() =>
                navigation.navigate('LessonPlayer', {
                  courseId: course.id,
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  videoUrl: lesson.video_url,
                })
              }
            >
              <View style={styles.lessonNum}>
                <Text style={styles.lessonNumText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                {lesson.notes ? <Text style={styles.lessonNotes} numberOfLines={1}>{lesson.notes}</Text> : null}
              </View>
              <Ionicons name={unlocked ? 'play-circle-outline' : 'lock-closed'} size={20} color={unlocked ? colors.primary : colors.textMuted} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.bg },
  title: { ...typography.pageTitle, marginBottom: 4 },
  instructor: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.primary, marginBottom: spacing.sm },
  description: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text, lineHeight: 21, marginBottom: spacing.md },
  lockBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  lockText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  lessonRowLocked: { opacity: 0.6 },
  lessonNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.text },
  lessonTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  lessonNotes: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});

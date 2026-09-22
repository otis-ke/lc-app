import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField, TextAreaField, SelectField, RadioGroup } from '../../components/FormFields';
import {
  addLesson,
  createCourse,
  deleteLesson,
  enrollStudent,
  fetchCourse,
  fetchEnrollmentsForCourse,
  fetchLessons,
  setEnrollmentPaid,
  updateCourse,
} from '../../lib/courses';
import { fetchApprovedInstructorProfiles } from '../../lib/instructors';
import { fetchAllStudents } from '../../lib/finance';
import { pickImage, uploadImage } from '../../lib/uploadImage';
import { colors, fonts, radii, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';
import type { AppInstructorProfile, AppModelProfile, Course, CourseEnrollment, CourseStatus, Lesson } from '../../types';

type Rt = RouteProp<DashboardStackParamList, 'AdminCourseEditor'>;

const STATUS_OPTIONS: CourseStatus[] = ['draft', 'published'];

export default function AdminCourseEditorScreen() {
  const route = useRoute<Rt>();
  const courseId = route.params?.courseId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [id, setId] = useState<string | null>(courseId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [status, setStatus] = useState<CourseStatus>('draft');
  const [instructorUid, setInstructorUid] = useState<string | null>(null);
  const [instructorName, setInstructorName] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<AppInstructorProfile[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [students, setStudents] = useState<AppModelProfile[]>([]);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);

  const [pickedStudentName, setPickedStudentName] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    const [insList, studentList] = await Promise.all([fetchApprovedInstructorProfiles(), fetchAllStudents()]);
    setInstructors(insList);
    setStudents(studentList);

    if (courseId) {
      const [course, lessonList, enrollmentList] = await Promise.all([
        fetchCourse(courseId),
        fetchLessons(courseId),
        fetchEnrollmentsForCourse(courseId),
      ]);
      if (course) {
        setTitle(course.title);
        setDescription(course.description);
        setPrice(String(course.price));
        setCoverImage(course.cover_image);
        setStatus(course.status);
        setInstructorUid(course.instructor_uid);
        setInstructorName(course.instructor_name);
      }
      setLessons(lessonList);
      setEnrollments(enrollmentList);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePickCover() {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(asset.uri, 'courses');
      setCoverImage(url);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSaveCourse() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give the course a title first.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateCourse(id, {
          title: title.trim(),
          description: description.trim(),
          price: price.trim() ? Number(price.trim()) : 0,
          cover_image: coverImage,
          instructor_uid: instructorUid,
          instructor_name: instructorName,
          status,
        });
      } else {
        const newId = await createCourse({
          title: title.trim(),
          description: description.trim(),
          price: price.trim() ? Number(price.trim()) : 0,
          cover_image: coverImage,
          instructor_uid: instructorUid,
          instructor_name: instructorName,
        });
        setId(newId);
      }
      Alert.alert('Saved', 'Course details updated.');
      await load();
    } catch (e: any) {
      Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickLessonVideo() {
    const asset = await pickImage({ videos: true });
    if (!asset || !id) return;
    setUploadingVideo(true);
    try {
      const url = await uploadImage(asset.uri, `courses/${id}/lessons`);
      setLessonVideoUrl(url);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleAddLesson() {
    if (!id || !lessonTitle.trim() || !lessonVideoUrl) {
      Alert.alert('Missing info', 'Add a title and upload a video first.');
      return;
    }
    setAddingLesson(true);
    try {
      await addLesson(id, lessonTitle.trim(), lessonVideoUrl, lessonNotes.trim() || null, lessons.length);
      setLessonTitle('');
      setLessonNotes('');
      setLessonVideoUrl(null);
      await load();
    } finally {
      setAddingLesson(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!id) return;
    await deleteLesson(id, lessonId);
    await load();
  }

  async function handleEnroll() {
    if (!id) return;
    const student = students.find((s) => s.full_name === pickedStudentName);
    if (!student) {
      Alert.alert('Pick a student', 'Choose a student to enroll first.');
      return;
    }
    setEnrolling(true);
    try {
      await enrollStudent(id, title, student.id, student.full_name);
      setPickedStudentName('');
      await load();
    } finally {
      setEnrolling(false);
    }
  }

  async function handleTogglePaid(enrollment: CourseEnrollment) {
    if (!id) return;
    await setEnrollmentPaid(id, enrollment.student_uid, price.trim() ? Number(price.trim()) : 0);
    await load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{id ? 'Edit Course' : 'New Course'}</Text>

      <Card>
        <Pressable style={styles.coverPicker} onPress={handlePickCover} disabled={uploadingCover}>
          {uploadingCover ? (
            <ActivityIndicator color={colors.primary} />
          ) : coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={24} color={colors.textMuted} />
              <Text style={styles.coverPickerText}>Add cover image</Text>
            </>
          )}
        </Pressable>

        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Runway Fundamentals" />
        <TextAreaField label="Description" value={description} onChangeText={setDescription} placeholder="What students will learn" />
        <TextField label="Price (KSh)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 8000" />
        <SelectField
          label="Instructor"
          value={instructorName ?? ''}
          placeholder="Assign an instructor"
          options={instructors.map((i) => i.full_name)}
          onChange={(name) => {
            const ins = instructors.find((i) => i.full_name === name);
            setInstructorUid(ins?.id ?? null);
            setInstructorName(ins?.full_name ?? null);
          }}
        />
        <RadioGroup label="Status" value={status} options={STATUS_OPTIONS} onChange={(v) => setStatus(v as CourseStatus)} />
        <Button label="Save Course" onPress={handleSaveCourse} loading={saving} style={{ marginTop: spacing.xs }} />
      </Card>

      {!id ? (
        <Text style={styles.hint}>Save the course first to add lessons and enroll students.</Text>
      ) : (
        <>
          <Card>
            <Text style={styles.cardTitle}>Lessons ({lessons.length})</Text>
            <View style={{ gap: 8, marginBottom: spacing.md }}>
              {lessons.map((lesson, idx) => (
                <View key={lesson.id} style={styles.lessonRow}>
                  <Text style={styles.lessonRowText} numberOfLines={1}>{idx + 1}. {lesson.title}</Text>
                  <Pressable onPress={() => handleDeleteLesson(lesson.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
              {lessons.length === 0 ? <Text style={styles.hint}>No lessons yet.</Text> : null}
            </View>

            <TextField label="Lesson title" value={lessonTitle} onChangeText={setLessonTitle} placeholder="e.g. Posture & Walk Basics" />
            <TextField label="Notes (optional)" value={lessonNotes} onChangeText={setLessonNotes} placeholder="Short summary" />
            <Pressable style={styles.videoPicker} onPress={handlePickLessonVideo} disabled={uploadingVideo}>
              {uploadingVideo ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name={lessonVideoUrl ? 'checkmark-circle' : 'videocam-outline'} size={16} color={lessonVideoUrl ? colors.success : colors.primary} />
              )}
              <Text style={styles.videoPickerText}>{lessonVideoUrl ? 'Video uploaded' : 'Upload lesson video'}</Text>
            </Pressable>
            <Button label="Add Lesson" onPress={handleAddLesson} loading={addingLesson} style={{ marginTop: spacing.sm }} />
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Enrollments ({enrollments.length})</Text>
            <View style={{ gap: 8, marginBottom: spacing.md }}>
              {enrollments.map((e) => (
                <View key={e.id} style={styles.enrollRow}>
                  <Text style={styles.enrollName} numberOfLines={1}>{e.student_name}</Text>
                  {e.paid ? (
                    <View style={styles.paidPill}><Text style={styles.paidPillText}>Paid</Text></View>
                  ) : (
                    <Pressable style={styles.markPaidBtn} onPress={() => handleTogglePaid(e)}>
                      <Text style={styles.markPaidBtnText}>Mark Paid</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {enrollments.length === 0 ? <Text style={styles.hint}>No students enrolled yet.</Text> : null}
            </View>

            <SelectField
              label="Enroll a student"
              value={pickedStudentName}
              placeholder="Choose a student"
              options={students.map((s) => s.full_name)}
              onChange={setPickedStudentName}
            />
            <Button label="Enroll" onPress={handleEnroll} loading={enrolling} />
          </Card>
        </>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { ...typography.pageTitle },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: spacing.sm },
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  coverPicker: {
    height: 130,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPickerText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted, marginTop: 6 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  lessonRowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  videoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  videoPickerText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.text },
  enrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  enrollName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  paidPill: { backgroundColor: colors.success + '22', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  paidPillText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: colors.success },
  markPaidBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 12 },
  markPaidBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: '#fff' },
});

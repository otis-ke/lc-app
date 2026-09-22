import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import type { Course, CourseEnrollment, CourseStatus, Lesson } from '../types';

const COURSES_COLLECTION = 'courses';
const ENROLLMENTS_COLLECTION = 'course_enrollments';

function mapCourse(id: string, data: Record<string, any>): Course {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    instructor_uid: data.instructor_uid ?? null,
    instructor_name: data.instructor_name ?? null,
    price: typeof data.price === 'number' ? data.price : 0,
    cover_image: data.cover_image ?? null,
    status: data.status ?? 'draft',
    lesson_count: typeof data.lesson_count === 'number' ? data.lesson_count : 0,
    created_at: toISO(data.created_at),
  };
}

function mapLesson(id: string, data: Record<string, any>): Lesson {
  return {
    id,
    course_id: data.course_id ?? '',
    title: data.title ?? '',
    video_url: data.video_url ?? '',
    notes: data.notes ?? null,
    order: typeof data.order === 'number' ? data.order : 0,
    created_at: toISO(data.created_at),
  };
}

function mapEnrollment(id: string, data: Record<string, any>): CourseEnrollment {
  return {
    id,
    course_id: data.course_id ?? '',
    course_title: data.course_title ?? '',
    student_uid: data.student_uid ?? '',
    student_name: data.student_name ?? '',
    paid: !!data.paid,
    amount_paid: typeof data.amount_paid === 'number' ? data.amount_paid : 0,
    enrolled_at: toISO(data.enrolled_at),
  };
}

// ----------------------------------------------------------- Courses ------

export async function fetchPublishedCourses(): Promise<Course[]> {
  const q = query(collection(db, COURSES_COLLECTION), where('status', '==', 'published'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCourse(d.id, d.data()));
}

export async function fetchAllCourses(): Promise<Course[]> {
  const q = query(collection(db, COURSES_COLLECTION), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCourse(d.id, d.data()));
}

export async function fetchCoursesForInstructor(instructorUid: string): Promise<Course[]> {
  const q = query(collection(db, COURSES_COLLECTION), where('instructor_uid', '==', instructorUid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCourse(d.id, d.data()));
}

export async function fetchCourse(courseId: string): Promise<Course | null> {
  const snap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
  return snap.exists() ? mapCourse(snap.id, snap.data()) : null;
}

export async function createCourse(input: {
  title: string;
  description: string;
  instructor_uid: string | null;
  instructor_name: string | null;
  price: number;
  cover_image: string | null;
}): Promise<string> {
  const ref = doc(collection(db, COURSES_COLLECTION));
  await setDoc(ref, {
    ...input,
    status: 'draft' as CourseStatus,
    lesson_count: 0,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCourse(
  courseId: string,
  data: Partial<Pick<Course, 'title' | 'description' | 'instructor_uid' | 'instructor_name' | 'price' | 'cover_image' | 'status'>>
): Promise<void> {
  await updateDoc(doc(db, COURSES_COLLECTION, courseId), data);
}

// ------------------------------------------------------------ Lessons -----

export async function fetchLessons(courseId: string): Promise<Lesson[]> {
  const q = query(collection(db, COURSES_COLLECTION, courseId, 'lessons'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapLesson(d.id, d.data()));
}

export async function addLesson(courseId: string, title: string, videoUrl: string, notes: string | null, order: number): Promise<void> {
  const ref = doc(collection(db, COURSES_COLLECTION, courseId, 'lessons'));
  await setDoc(ref, {
    course_id: courseId,
    title,
    video_url: videoUrl,
    notes,
    order,
    created_at: serverTimestamp(),
  });
  await updateDoc(doc(db, COURSES_COLLECTION, courseId), { lesson_count: increment(1) });
}

export async function deleteLesson(courseId: string, lessonId: string): Promise<void> {
  await deleteDoc(doc(db, COURSES_COLLECTION, courseId, 'lessons', lessonId));
  await updateDoc(doc(db, COURSES_COLLECTION, courseId), { lesson_count: increment(-1) });
}

// -------------------------------------------------------- Enrollments -----

export async function fetchEnrollmentsForStudent(studentUid: string): Promise<CourseEnrollment[]> {
  const q = query(collection(db, ENROLLMENTS_COLLECTION), where('student_uid', '==', studentUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapEnrollment(d.id, d.data()));
}

export async function fetchEnrollmentsForCourse(courseId: string): Promise<CourseEnrollment[]> {
  const q = query(collection(db, ENROLLMENTS_COLLECTION), where('course_id', '==', courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapEnrollment(d.id, d.data()));
}

function enrollmentId(courseId: string, studentUid: string): string {
  return `${courseId}_${studentUid}`;
}

// Admin action: enroll a student in a course, initially unpaid — access
// stays locked until markEnrollmentPaid() is called after the student pays
// the school directly (no in-app payment collection).
export async function enrollStudent(courseId: string, courseTitle: string, studentUid: string, studentName: string): Promise<void> {
  const id = enrollmentId(courseId, studentUid);
  await setDoc(doc(db, ENROLLMENTS_COLLECTION, id), {
    course_id: courseId,
    course_title: courseTitle,
    student_uid: studentUid,
    student_name: studentName,
    paid: false,
    amount_paid: 0,
    enrolled_at: serverTimestamp(),
  });
}

export async function setEnrollmentPaid(courseId: string, studentUid: string, amountPaid: number): Promise<void> {
  const id = enrollmentId(courseId, studentUid);
  const snap = await getDoc(doc(db, ENROLLMENTS_COLLECTION, id));
  await updateDoc(doc(db, ENROLLMENTS_COLLECTION, id), { paid: true, amount_paid: amountPaid });
  const courseTitle = snap.exists() ? snap.data().course_title : 'your course';
  await createNotification(studentUid, 'course_unlocked', 'Course unlocked', `You now have access to "${courseTitle}".`, courseId);
}

export async function fetchEnrollmentForCourse(courseId: string, studentUid: string): Promise<CourseEnrollment | null> {
  const snap = await getDoc(doc(db, ENROLLMENTS_COLLECTION, enrollmentId(courseId, studentUid)));
  return snap.exists() ? mapEnrollment(snap.id, snap.data()) : null;
}

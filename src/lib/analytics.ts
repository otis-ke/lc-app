import { Timestamp, collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';

export interface DailyCount {
  label: string; // "Mon", "Tue", ...
  count: number;
}

export interface PlatformAnalytics {
  totals: { users: number; models: number; instructors: number; brands: number };
  signupsLast7Days: DailyCount[];
  pendingInstructorApplications: number;
  pendingStudentReviews: number;
  approvedInstructors: number;
  rejectedInstructors: number;
  approvedStudents: number;
  rejectedStudents: number;
  courses: { total: number; published: number };
  enrollments: { total: number; paid: number };
  conversations: number;
  openCastings: number;
}

async function countOf(name: string): Promise<number> {
  const snap = await getCountFromServer(collection(db, name));
  return snap.data().count;
}

async function countWhere(name: string, field: string, op: any, value: any): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, name), where(field, op, value)));
  return snap.data().count;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Note: review_status-based counts only see profiles saved since that field
// was introduced — a profile from before then has no review_status in
// Firestore, so a server-side `==` filter can't match it (the app's own
// student-list screen still shows it correctly, since it derives the status
// client-side from `verified` on read — see mapModelProfile).
export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    users,
    models,
    instructors,
    brands,
    pendingInstructorApplications,
    approvedInstructors,
    rejectedInstructors,
    pendingStudentReviews,
    approvedStudents,
    rejectedStudents,
    courses,
    publishedCourses,
    enrollmentsSnap,
    conversations,
    openCastings,
    recentSignupsSnap,
  ] = await Promise.all([
    countOf('app_users'),
    countOf('app_model_profiles'),
    countOf('app_instructor_profiles'),
    countOf('app_brand_profiles'),
    countWhere('instructor_applications', 'status', '==', 'new'),
    countWhere('instructor_applications', 'status', '==', 'contacted'),
    countWhere('instructor_applications', 'status', '==', 'closed'),
    countWhere('app_model_profiles', 'review_status', '==', 'pending'),
    countWhere('app_model_profiles', 'review_status', '==', 'approved'),
    countWhere('app_model_profiles', 'review_status', '==', 'rejected'),
    countOf('courses'),
    countWhere('courses', 'status', '==', 'published'),
    getDocs(collection(db, 'course_enrollments')),
    countOf('conversations'),
    countWhere('castings', 'status', '==', 'open'),
    getDocs(query(collection(db, 'app_users'), where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo)))),
  ]);

  const paidEnrollments = enrollmentsSnap.docs.filter((d) => d.data().paid).length;

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    buckets.set(d.toDateString(), 0);
  }
  recentSignupsSnap.docs.forEach((d) => {
    const created = toISO(d.data().created_at);
    const key = new Date(created).toDateString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  const signupsLast7Days: DailyCount[] = Array.from(buckets.entries()).map(([dateStr, count]) => ({
    label: DAY_LABELS[new Date(dateStr).getDay()],
    count,
  }));

  return {
    totals: { users, models, instructors, brands },
    signupsLast7Days,
    pendingInstructorApplications,
    pendingStudentReviews,
    approvedInstructors,
    rejectedInstructors,
    approvedStudents,
    rejectedStudents,
    courses: { total: courses, published: publishedCourses },
    enrollments: { total: enrollmentsSnap.size, paid: paidEnrollments },
    conversations,
    openCastings,
  };
}

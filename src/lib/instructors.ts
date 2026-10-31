import {
  collection,
  doc,
  getDoc,
  getDocs,
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
import { logAdminAction } from './adminLog';
import type {
  AppInstructorProfile,
  AvailabilitySlot,
  GeoPoint,
  InstructorApplication,
  WithdrawalRequest,
  WithdrawalStatus,
} from '../types';

// Self-serve instructor profiles — created only once an instructor_applications
// doc (the existing public "Become an Instructor" lead form) is approved by
// an admin. Doc id = auth uid.
const PROFILES_COLLECTION = 'app_instructor_profiles';
const APPLICATIONS_COLLECTION = 'instructor_applications';
const WITHDRAWALS_COLLECTION = 'withdrawal_requests';

function mapInstructorProfile(id: string, data: Record<string, any>): AppInstructorProfile {
  return {
    id,
    full_name: data.full_name ?? '',
    bio: data.bio ?? '',
    specialties: Array.isArray(data.specialties) ? data.specialties : [],
    location: data.location ?? null,
    geo:
      data.geo && typeof data.geo.lat === 'number' && typeof data.geo.lng === 'number'
        ? { lat: data.geo.lat, lng: data.geo.lng, updated_at: toISO(data.geo.updated_at) }
        : null,
    mode: data.mode ?? 'both',
    price_per_session: typeof data.price_per_session === 'number' ? data.price_per_session : 0,
    experience_years: typeof data.experience_years === 'number' ? data.experience_years : null,
    photos: Array.isArray(data.photos) ? data.photos : [],
    availability: Array.isArray(data.availability) ? data.availability : [],
    verified: !!data.verified,
    rating_avg: typeof data.rating_avg === 'number' ? data.rating_avg : 0,
    rating_count: typeof data.rating_count === 'number' ? data.rating_count : 0,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

export async function fetchInstructorSelfProfile(uid: string): Promise<AppInstructorProfile | null> {
  const snap = await getDoc(doc(db, PROFILES_COLLECTION, uid));
  return snap.exists() ? mapInstructorProfile(snap.id, snap.data()) : null;
}

export async function saveInstructorProfile(
  uid: string,
  data: Partial<Pick<AppInstructorProfile, 'bio' | 'specialties' | 'location' | 'mode' | 'price_per_session' | 'experience_years' | 'photos'>>
): Promise<void> {
  await setDoc(doc(db, PROFILES_COLLECTION, uid), { ...data, updated_at: serverTimestamp() }, { merge: true });
}

export async function saveInstructorAvailability(uid: string, availability: AvailabilitySlot[]): Promise<void> {
  await setDoc(doc(db, PROFILES_COLLECTION, uid), { availability, updated_at: serverTimestamp() }, { merge: true });
}

export async function saveInstructorLocation(uid: string, lat: number, lng: number): Promise<void> {
  const geo: Omit<GeoPoint, 'updated_at'> & { updated_at: ReturnType<typeof serverTimestamp> } = {
    lat,
    lng,
    updated_at: serverTimestamp(),
  };
  await setDoc(doc(db, PROFILES_COLLECTION, uid), { geo, updated_at: serverTimestamp() }, { merge: true });
}

// The app's own self-serve instructor directory — distinct from the
// website-managed lc_model_connect_instructors roster in content.ts (those
// don't carry a uid, so they can't be linked to a real bookable account).
// Every doc here was created by approveInstructorApplication(), so all are
// already verified.
export async function fetchApprovedInstructorProfiles(): Promise<AppInstructorProfile[]> {
  const q = query(collection(db, PROFILES_COLLECTION), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapInstructorProfile(d.id, d.data()));
}

// ------------------------------------------------------ Applications ------

function mapApplication(id: string, data: Record<string, any>): InstructorApplication {
  return {
    id,
    uid: data.uid ?? null,
    full_name: data.full_name ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    country: data.country ?? '',
    location: data.location ?? '',
    experience_years: typeof data.experience_years === 'number' ? data.experience_years : null,
    specialization: data.specialization ?? '',
    socials: data.socials ?? null,
    status: data.status ?? 'new',
    review_note: data.review_note ?? null,
    reviewed_by_name: data.reviewed_by_name ?? null,
    reviewed_at: data.reviewed_at ? toISO(data.reviewed_at) : null,
    created_at: toISO(data.created_at),
  };
}

export async function fetchPendingInstructorApplications(): Promise<InstructorApplication[]> {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('status', '==', 'new'),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApplication(d.id, d.data()));
}

// History for the audit view — every application admin has already acted
// on (approved into 'contacted', or declined into 'closed').
export async function fetchResolvedInstructorApplications(): Promise<InstructorApplication[]> {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('status', 'in', ['contacted', 'closed']),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApplication(d.id, d.data()));
}

export async function fetchInstructorApplication(applicationId: string): Promise<InstructorApplication | null> {
  const snap = await getDoc(doc(db, APPLICATIONS_COLLECTION, applicationId));
  return snap.exists() ? mapApplication(snap.id, snap.data()) : null;
}

// Approving links the application to a real app_instructor_profiles doc
// keyed by the applicant's uid (only possible when they applied while
// signed in — see BecomeInstructorScreen). Rejecting just closes the lead.
// Both record who made the call and when (reviewed_by_name/reviewed_at) and
// append to the admin audit log, so every decision stays reviewable.
export async function approveInstructorApplication(
  application: InstructorApplication,
  adminUid: string,
  adminName: string
): Promise<void> {
  if (!application.uid) {
    throw new Error('This application was submitted without an account and cannot be approved into a profile.');
  }
  await setDoc(
    doc(db, PROFILES_COLLECTION, application.uid),
    {
      full_name: application.full_name,
      bio: '',
      specialties: [application.specialization].filter(Boolean),
      location: application.location,
      geo: null,
      mode: 'both',
      price_per_session: 0,
      experience_years: application.experience_years,
      photos: [],
      availability: [],
      verified: true,
      rating_avg: 0,
      rating_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, application.id), {
    status: 'contacted',
    reviewed_by_name: adminName,
    reviewed_at: serverTimestamp(),
  });
  await createNotification(
    application.uid,
    'instructor_approved',
    "You're approved!",
    "Your instructor application was approved — set your price and availability to start taking bookings."
  );
  await logAdminAction({
    action: 'instructor_approved',
    targetType: 'instructor',
    targetUid: application.uid,
    targetName: application.full_name,
    performedByUid: adminUid,
    performedByName: adminName,
  });
}

export async function rejectInstructorApplication(
  application: InstructorApplication,
  adminUid: string,
  adminName: string,
  reason?: string
): Promise<void> {
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, application.id), {
    status: 'closed',
    review_note: reason ?? null,
    reviewed_by_name: adminName,
    reviewed_at: serverTimestamp(),
  });
  if (application.uid) {
    await createNotification(
      application.uid,
      'application_rejected',
      'Application update',
      reason
        ? `Your instructor application wasn't approved this time: ${reason}`
        : "Your instructor application wasn't approved this time. You're welcome to re-apply once you've updated your details."
    );
  }
  await logAdminAction({
    action: 'instructor_rejected',
    targetType: 'instructor',
    targetUid: application.uid ?? application.id,
    targetName: application.full_name,
    performedByUid: adminUid,
    performedByName: adminName,
    note: reason,
  });
}

// -------------------------------------------------------- Withdrawals -----

function mapWithdrawal(id: string, data: Record<string, any>): WithdrawalRequest {
  return {
    id,
    instructor_uid: data.instructor_uid ?? '',
    instructor_name: data.instructor_name ?? '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    status: data.status ?? 'requested',
    requested_at: toISO(data.requested_at),
  };
}

export async function requestWithdrawal(instructorUid: string, instructorName: string, amount: number): Promise<void> {
  await setDoc(doc(collection(db, WITHDRAWALS_COLLECTION)), {
    instructor_uid: instructorUid,
    instructor_name: instructorName,
    amount,
    status: 'requested',
    requested_at: serverTimestamp(),
  });
}

export async function fetchWithdrawalsForInstructor(uid: string): Promise<WithdrawalRequest[]> {
  const q = query(
    collection(db, WITHDRAWALS_COLLECTION),
    where('instructor_uid', '==', uid),
    orderBy('requested_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapWithdrawal(d.id, d.data()));
}

export async function fetchAllWithdrawals(): Promise<WithdrawalRequest[]> {
  const q = query(collection(db, WITHDRAWALS_COLLECTION), orderBy('requested_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapWithdrawal(d.id, d.data()));
}

export async function updateWithdrawalStatus(id: string, status: WithdrawalStatus, instructorUid: string, amount: number): Promise<void> {
  await updateDoc(doc(db, WITHDRAWALS_COLLECTION, id), { status });
  await createNotification(
    instructorUid,
    'withdrawal_update',
    status === 'paid' ? 'Withdrawal paid' : 'Withdrawal update',
    status === 'paid'
      ? `Your withdrawal of KSh ${amount.toLocaleString()} has been paid out.`
      : `Your withdrawal request of KSh ${amount.toLocaleString()} was ${status}.`
  );
}

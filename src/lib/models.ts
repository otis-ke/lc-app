import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import type { AppModelProfile, DevelopmentProgress } from '../types';
import { EMPTY_DEVELOPMENT } from '../types';

// Self-serve model portfolios — separate from the site-managed
// lc_models_management roster (see content.ts). Doc id = auth uid, so a
// model always owns exactly one profile.
const COLLECTION = 'app_model_profiles';

export function mapModelProfile(id: string, data: Record<string, any>): AppModelProfile {
  return {
    id,
    full_name: data.full_name ?? '',
    age: typeof data.age === 'number' ? data.age : null,
    location: data.location ?? null,
    height_cm: typeof data.height_cm === 'number' ? data.height_cm : null,
    bust: data.bust ?? null,
    waist: data.waist ?? null,
    hips: data.hips ?? null,
    shoe_size: data.shoe_size ?? null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    bio: data.bio ?? '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    photos: Array.isArray(data.photos) ? data.photos : [],
    social_instagram: data.social_instagram ?? null,
    social_tiktok: data.social_tiktok ?? null,
    social_other: data.social_other ?? null,
    availability_notes: data.availability_notes ?? null,
    development: { ...EMPTY_DEVELOPMENT, ...(data.development ?? {}) },
    verified: !!data.verified,
    rating_avg: typeof data.rating_avg === 'number' ? data.rating_avg : 0,
    rating_count: typeof data.rating_count === 'number' ? data.rating_count : 0,
    balance: typeof data.balance === 'number' ? data.balance : 0,
    payment_status: data.payment_status ?? 'unpaid',
    geo:
      data.geo && typeof data.geo.lat === 'number' && typeof data.geo.lng === 'number'
        ? { lat: data.geo.lat, lng: data.geo.lng, updated_at: toISO(data.geo.updated_at) }
        : null,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

export async function fetchMyModelProfile(uid: string): Promise<AppModelProfile | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? mapModelProfile(snap.id, snap.data()) : null;
}

// Same function serves "view another model's public profile" — the
// document shape and read permissions are identical either way.
export const fetchModelProfileById = fetchMyModelProfile;

export async function saveMyModelProfile(
  uid: string,
  data: Partial<
    Omit<
      AppModelProfile,
      'id' | 'created_at' | 'updated_at' | 'verified' | 'rating_avg' | 'rating_count' | 'balance' | 'payment_status' | 'geo'
    >
  >,
  isNew: boolean
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, uid),
    {
      ...data,
      ...(isNew
        ? { created_at: serverTimestamp(), verified: false, rating_avg: 0, rating_count: 0, balance: 0, payment_status: 'unpaid', geo: null }
        : {}),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateModelDevelopment(uid: string, development: DevelopmentProgress): Promise<void> {
  await setDoc(doc(db, COLLECTION, uid), { development, updated_at: serverTimestamp() }, { merge: true });
}

export async function saveModelLocation(uid: string, lat: number, lng: number): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, uid),
    { geo: { lat, lng, updated_at: serverTimestamp() }, updated_at: serverTimestamp() },
    { merge: true }
  );
}

// Public directory used for "nearby people" discovery (Connect tab) —
// app_model_profiles is publicly readable, same as app_instructor_profiles.
export async function fetchModelDirectory(): Promise<AppModelProfile[]> {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapModelProfile(d.id, d.data()));
}

// Admin action: mark a student's profile as approved/verified (mirrors the
// instructor approval flow) — shows a verified badge and lets admin track
// who's been reviewed.
export async function setStudentVerified(uid: string, verified: boolean): Promise<void> {
  await setDoc(doc(db, COLLECTION, uid), { verified }, { merge: true });
  if (verified) {
    await createNotification(uid, 'profile_approved', "You're approved!", 'Your student profile has been reviewed and approved by admin.');
  }
}

import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import type { Review, ReviewTargetType } from '../types';

const REVIEWS_COLLECTION = 'reviews';

function targetCollection(type: ReviewTargetType): string {
  return type === 'instructor' ? 'app_instructor_profiles' : 'app_model_profiles';
}

function mapReview(id: string, data: Record<string, any>): Review {
  return {
    id,
    booking_id: data.booking_id ?? null,
    target_type: data.target_type ?? 'instructor',
    target_uid: data.target_uid ?? '',
    target_name: data.target_name ?? '',
    author_uid: data.author_uid ?? '',
    author_name: data.author_name ?? '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    comment: data.comment ?? '',
    created_at: toISO(data.created_at),
  };
}

export interface SubmitReviewInput {
  booking_id: string | null;
  target_type: ReviewTargetType;
  target_uid: string;
  target_name: string;
  author_uid: string;
  author_name: string;
  rating: number;
  comment: string;
}

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  await setDoc(doc(collection(db, REVIEWS_COLLECTION)), { ...input, created_at: serverTimestamp() });

  // Recompute the running average inside a transaction so two reviews
  // landing at the same time can't clobber each other's count.
  const profileRef = doc(db, targetCollection(input.target_type), input.target_uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(profileRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const prevCount = typeof data.rating_count === 'number' ? data.rating_count : 0;
    const prevAvg = typeof data.rating_avg === 'number' ? data.rating_avg : 0;
    const nextCount = prevCount + 1;
    const nextAvg = (prevAvg * prevCount + input.rating) / nextCount;
    tx.update(profileRef, { rating_avg: nextAvg, rating_count: nextCount });
  });
}

export async function fetchReviewsForTarget(targetUid: string, targetType: ReviewTargetType): Promise<Review[]> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('target_uid', '==', targetUid),
    where('target_type', '==', targetType),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

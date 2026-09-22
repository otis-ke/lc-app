import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import type { Casting, CastingApplication, CastingApplicationStatus, CastingPosterType } from '../types';

const CASTINGS_COLLECTION = 'castings';
const APPLICATIONS_COLLECTION = 'casting_applications';

function mapCasting(id: string, data: Record<string, any>): Casting {
  return {
    id,
    posted_by_uid: data.posted_by_uid ?? '',
    posted_by_name: data.posted_by_name ?? '',
    posted_by_type: data.posted_by_type ?? 'brand',
    title: data.title ?? '',
    description: data.description ?? '',
    category: data.category ?? '',
    location: data.location ?? '',
    date: data.date ?? null,
    compensation: data.compensation ?? null,
    status: data.status ?? 'open',
    created_at: toISO(data.created_at),
  };
}

export interface CreateCastingInput {
  posted_by_uid: string;
  posted_by_name: string;
  posted_by_type: CastingPosterType;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string | null;
  compensation: string | null;
}

export async function createCasting(input: CreateCastingInput): Promise<void> {
  await setDoc(doc(collection(db, CASTINGS_COLLECTION)), {
    ...input,
    status: 'open',
    created_at: serverTimestamp(),
  });
}

export async function fetchOpenCastings(): Promise<Casting[]> {
  const q = query(collection(db, CASTINGS_COLLECTION), where('status', '==', 'open'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCasting(d.id, d.data()));
}

export async function fetchCasting(id: string): Promise<Casting | null> {
  const snap = await getDoc(doc(db, CASTINGS_COLLECTION, id));
  return snap.exists() ? mapCasting(snap.id, snap.data()) : null;
}

export async function fetchCastingsByPoster(uid: string): Promise<Casting[]> {
  const q = query(collection(db, CASTINGS_COLLECTION), where('posted_by_uid', '==', uid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCasting(d.id, d.data()));
}

export async function closeCasting(id: string): Promise<void> {
  await updateDoc(doc(db, CASTINGS_COLLECTION, id), { status: 'closed' });
}

// -------------------------------------------------------- Applications ----

function mapApplication(id: string, data: Record<string, any>): CastingApplication {
  return {
    id,
    casting_id: data.casting_id ?? '',
    casting_title: data.casting_title ?? '',
    model_uid: data.model_uid ?? '',
    model_name: data.model_name ?? '',
    message: data.message ?? '',
    status: data.status ?? 'submitted',
    created_at: toISO(data.created_at),
  };
}

export interface ApplyToCastingInput {
  casting: Casting;
  model_uid: string;
  model_name: string;
  message: string;
}

export async function applyToCasting({ casting, model_uid, model_name, message }: ApplyToCastingInput): Promise<void> {
  await setDoc(doc(collection(db, APPLICATIONS_COLLECTION)), {
    casting_id: casting.id,
    casting_title: casting.title,
    model_uid,
    model_name,
    message,
    status: 'submitted',
    created_at: serverTimestamp(),
  });
  await createNotification(
    casting.posted_by_uid,
    'casting_application',
    'New casting application',
    `${model_name} applied to "${casting.title}".`,
    casting.id
  );
}

export async function fetchApplicationsForCasting(castingId: string): Promise<CastingApplication[]> {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('casting_id', '==', castingId),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApplication(d.id, d.data()));
}

export async function fetchApplicationsForModel(uid: string): Promise<CastingApplication[]> {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('model_uid', '==', uid),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApplication(d.id, d.data()));
}

export async function updateApplicationStatus(application: CastingApplication, status: CastingApplicationStatus): Promise<void> {
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, application.id), { status });
  await createNotification(
    application.model_uid,
    'casting_status',
    `Application ${status}`,
    `Your application to "${application.casting_title}" was ${status}.`,
    application.casting_id
  );
}

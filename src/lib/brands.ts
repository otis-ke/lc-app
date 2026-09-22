import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import type { AppBrandProfile } from '../types';

// Self-serve brand/client company profiles. Doc id = auth uid.
const COLLECTION = 'app_brand_profiles';

function mapBrandProfile(id: string, data: Record<string, any>): AppBrandProfile {
  return {
    id,
    company_name: data.company_name ?? '',
    contact_name: data.contact_name ?? null,
    industry: data.industry ?? null,
    logo_url: data.logo_url ?? null,
    description: data.description ?? null,
    location: data.location ?? null,
    created_at: toISO(data.created_at),
  };
}

export async function fetchMyBrandProfile(uid: string): Promise<AppBrandProfile | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? mapBrandProfile(snap.id, snap.data()) : null;
}

export async function saveMyBrandProfile(
  uid: string,
  data: Partial<Omit<AppBrandProfile, 'id' | 'created_at'>>,
  isNew: boolean
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, uid),
    { ...data, ...(isNew ? { created_at: serverTimestamp() } : {}) },
    { merge: true }
  );
}

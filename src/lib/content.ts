import { collection, doc, getCountFromServer, getDoc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getCached, setCached } from './cache';
import type { BlogPost, Instructor, ModelProfile } from '../types';

// Wraps a live Firestore fetch with a disk cache fallback (see cache.ts) —
// on success, the result is cached for next time; on failure (most often:
// no network), the last successful result is returned instead of an empty
// list, so previously-viewed content still shows up offline.
async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    setCached(key, data);
    return data;
  } catch (err) {
    const cached = await getCached<T>(key);
    if (cached !== null) return cached;
    throw err;
  }
}

// Read-only access to the SAME Firestore collections the live website
// already uses (schoolcms-77713 — see blog.js/modelsmanagement.js/
// modelconnect.js for the original field names). Every function here maps
// the site's raw field names (e.g. `Name_story`, `content[].value`) to the
// clean shapes in src/types/index.ts, so screens never see the raw shape.
//
// There's no create/update/delete here on purpose — content is managed
// through the website's own admin.html (embedded via WebView in
// src/screens/admin/AdminHomeScreen.tsx), which already has full CRUD for
// these collections. Keeping a single admin implementation avoids two
// editors drifting out of sync with different fields/behavior.

export function toISO(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

// ---------------------------------------------------------------- Blog ----
const BLOG_COLLECTION = 'lcschoolblog';

function mapBlogPost(id: string, data: Record<string, any>): BlogPost {
  return {
    id,
    title: data.name ?? 'Untitled',
    header_image: data.header_image ?? null,
    content: Array.isArray(data.content)
      ? data.content.map((c: any) => c?.value).filter(Boolean)
      : [],
    published_on: toISO(data.published_on),
    created_at: toISO(data.published_on),
  };
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  return withCache('blogPosts', async () => {
    const q = query(collection(db, BLOG_COLLECTION), orderBy('published_on', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapBlogPost(d.id, d.data()));
  });
}

export async function fetchBlogPost(id: string): Promise<BlogPost | null> {
  const snap = await getDoc(doc(db, BLOG_COLLECTION, id));
  return snap.exists() ? mapBlogPost(snap.id, snap.data()) : null;
}

// -------------------------------------------------------------- Models ----
const MODELS_COLLECTION = 'lc_models_management';

function mapModel(id: string, data: Record<string, any>): ModelProfile {
  return {
    id,
    name: data.name ?? 'Unnamed',
    header_image: data.header_image ?? null,
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    text_description: data.text_description ?? null,
    full_description: data.full_description ?? null,
    publish_date: toISO(data.publish_date),
    created_at: toISO(data.publish_date),
  };
}

export async function fetchModels(): Promise<ModelProfile[]> {
  return withCache('models', async () => {
    const q = query(collection(db, MODELS_COLLECTION), orderBy('publish_date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapModel(d.id, d.data()));
  });
}

export async function fetchModel(id: string): Promise<ModelProfile | null> {
  const snap = await getDoc(doc(db, MODELS_COLLECTION, id));
  return snap.exists() ? mapModel(snap.id, snap.data()) : null;
}

// --------------------------------------------------------- Instructors ----
const INSTRUCTORS_COLLECTION = 'lc_model_connect_instructors';

function mapInstructor(id: string, data: Record<string, any>): Instructor {
  return {
    id,
    name: data.Name_story ?? 'Instructor',
    header_image: data.header_image_stories ?? null,
    content_images: Array.isArray(data.content_images) ? data.content_images.filter(Boolean) : [],
    location: data.location ?? null,
    specialization: data.specialization ?? null,
    experience_years: typeof data.experience_years === 'number' ? data.experience_years : null,
    fee_notes: data.fee_notes ?? null,
    description: data.text_description ?? '',
    created_at: toISO(data.created_on),
  };
}

export async function fetchInstructors(): Promise<Instructor[]> {
  return withCache('instructors', async () => {
    const q = query(collection(db, INSTRUCTORS_COLLECTION), orderBy('created_on', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapInstructor(d.id, d.data()));
  });
}

export async function fetchInstructor(id: string): Promise<Instructor | null> {
  const snap = await getDoc(doc(db, INSTRUCTORS_COLLECTION, id));
  return snap.exists() ? mapInstructor(snap.id, snap.data()) : null;
}

export async function countInstructors(): Promise<number> {
  const snap = await getCountFromServer(collection(db, INSTRUCTORS_COLLECTION));
  return snap.data().count;
}

// ----------------------------------------------------------- Banners ------
// The website manages every hero/banner image through small single-purpose
// Firestore collections (see admindash/mainheader.html, modelsheader.html,
// diversityupdate.html, etc.). These were previously skipped in favor of
// bundled static photos (src/data/localImages.ts) — now wired up for real so
// hero art reflects whatever's actually live, same as the website. The local
// bundled photos still exist as a *last-resort* fallback only, used when a
// collection is genuinely empty or a document has no image set — never as
// the primary source.

async function fetchFirstDocImage(
  collectionName: string,
  field: string,
  orderField?: string
): Promise<string | null> {
  const ref = collection(db, collectionName);
  const snap = await getDocs(orderField ? query(ref, orderBy(orderField, 'desc')) : query(ref));
  if (snap.empty) return null;
  const data = snap.docs[0].data() as Record<string, any>;
  return data[field] ?? null;
}

export const fetchHomeHeroImage = () =>
  withCache('homeHero', () => fetchFirstDocImage('main_header_banner', 'image1_vedio'));
export const fetchModelsHeroImage = () =>
  withCache('modelsHero', () => fetchFirstDocImage('models_header', 'header_image', 'time'));
export const fetchHomeCoachingHeroImage = () =>
  withCache('homeCoachingHero', () => fetchFirstDocImage('homecoaching_home', 'header_image'));
export const fetchEnrollHeroImage = () =>
  withCache('enrollHero', () => fetchFirstDocImage('enroll_header', 'header_image'));

export async function fetchDiversityPhotos(): Promise<string[]> {
  return withCache('diversityPhotos', async () => {
    const q = query(collection(db, 'diversity_and_inclusivity'), orderBy('time', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().header_image).filter(Boolean);
  });
}

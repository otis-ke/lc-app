import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { sendPushNotification } from './push';
import type { AppNotification, NotificationType } from '../types';

// In-app notification feed (Firestore-backed) — every notification also
// fires a real push in the same call (see push.ts) when the target user has
// a registered push_token, so the bell icon feed and the OS notification
// tray always agree.
const COLLECTION = 'notifications';
const USERS_COLLECTION = 'app_users';

function mapNotification(id: string, data: Record<string, any>): AppNotification {
  return {
    id,
    user_uid: data.user_uid ?? '',
    type: data.type ?? 'new_message',
    title: data.title ?? '',
    body: data.body ?? '',
    related_id: data.related_id ?? null,
    read: !!data.read,
    created_at: toISO(data.created_at),
  };
}

export async function createNotification(
  userUid: string,
  type: NotificationType,
  title: string,
  body: string,
  relatedId: string | null = null
): Promise<void> {
  // Best-effort — a notification failing to write should never block the
  // booking/application/message write it's describing.
  try {
    await setDoc(doc(collection(db, COLLECTION)), {
      user_uid: userUid,
      type,
      title,
      body,
      related_id: relatedId,
      read: false,
      created_at: serverTimestamp(),
    });
  } catch {
    // ignore
  }

  try {
    const userSnap = await getDoc(doc(db, USERS_COLLECTION, userUid));
    const token = userSnap.exists() ? userSnap.data().push_token : null;
    if (token) await sendPushNotification(token, title, body, { type, related_id: relatedId });
  } catch {
    // ignore — push is additive, the in-app feed above already has it
  }
}

export async function fetchNotifications(uid: string): Promise<AppNotification[]> {
  const q = query(collection(db, COLLECTION), where('user_uid', '==', uid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapNotification(d.id, d.data()));
}

export async function countUnreadNotifications(uid: string): Promise<number> {
  const q = query(collection(db, COLLECTION), where('user_uid', '==', uid), where('read', '==', false));
  const snap = await getDocs(q);
  return snap.size;
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const q = query(collection(db, COLLECTION), where('user_uid', '==', uid), where('read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}

// Live in-app "pop up" — a Firestore listener works everywhere (web
// included) without needing an OS push token/EAS project, so it's the
// reliable fallback that always fires while the app is open. Only calls
// back for notifications created AFTER the listener attaches (the initial
// snapshot is swallowed) so opening the app doesn't replay old history as
// pop-ups.
export function subscribeToNewNotifications(uid: string, onNew: (n: AppNotification) => void): () => void {
  const q = query(collection(db, COLLECTION), where('user_uid', '==', uid), orderBy('created_at', 'desc'), limit(15));
  let isInitialSnapshot = true;
  return onSnapshot(q, (snap) => {
    if (isInitialSnapshot) {
      isInitialSnapshot = false;
      return;
    }
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') onNew(mapNotification(change.doc.id, change.doc.data()));
    });
  });
}

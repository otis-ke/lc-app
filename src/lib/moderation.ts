import { arrayRemove, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { notifyAllAdmins } from './notifications';

// Play Store's User Generated Content policy requires any app with
// user-to-user messaging to offer a way to block and report — this is that
// mechanism. Blocking lives on the blocker's own app_users doc so it only
// ever needs a self-write; reports go to a dedicated collection admin can
// review (and trigger the same admin notification pipeline everything else
// in the app already uses).
const USERS_COLLECTION = 'app_users';
const REPORTS_COLLECTION = 'user_reports';

export async function blockUser(myUid: string, blockedUid: string): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, myUid), { blocked_uids: arrayUnion(blockedUid) }, { merge: true });
}

export async function unblockUser(myUid: string, blockedUid: string): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, myUid), { blocked_uids: arrayRemove(blockedUid) }, { merge: true });
}

// Checked before a message send goes through — blocks are one-directional
// by design (either participant blocking the other stops that pair from
// messaging, same as most chat apps).
export async function isEitherBlocked(uidA: string, uidB: string): Promise<boolean> {
  const [snapA, snapB] = await Promise.all([
    getDoc(doc(db, USERS_COLLECTION, uidA)),
    getDoc(doc(db, USERS_COLLECTION, uidB)),
  ]);
  const blockedByA: string[] = snapA.data()?.blocked_uids ?? [];
  const blockedByB: string[] = snapB.data()?.blocked_uids ?? [];
  return blockedByA.includes(uidB) || blockedByB.includes(uidA);
}

export async function reportUser(
  reporterUid: string,
  reporterName: string,
  reportedUid: string,
  reportedName: string,
  reason: string,
  conversationId?: string
): Promise<void> {
  await setDoc(doc(collection(db, REPORTS_COLLECTION)), {
    reporter_uid: reporterUid,
    reporter_name: reporterName,
    reported_uid: reportedUid,
    reported_name: reportedName,
    reason,
    conversation_id: conversationId ?? null,
    status: 'open',
    created_at: serverTimestamp(),
  });
  await notifyAllAdmins('user_reported', `${reporterName} reported ${reportedName}`, reason).catch(() => {});
}

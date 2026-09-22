import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import { decryptMessageText, encryptMessageText } from './crypto';
import type { Conversation, MediaType, Message } from '../types';

const CONVERSATIONS_COLLECTION = 'conversations';

// Deterministic id so two people always land in the same thread no matter
// who messages first — sorted so `${uidA}_${uidB}` is stable either
// direction.
export function conversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

function mapConversation(id: string, data: Record<string, any>): Conversation {
  return {
    id,
    participants: data.participants ?? ['', ''],
    participant_names: data.participant_names ?? {},
    last_message: data.last_message ? decryptMessageText(data.last_message) : null,
    last_message_at: data.last_message_at ? toISO(data.last_message_at) : null,
    created_at: toISO(data.created_at),
  };
}

export async function ensureConversation(
  uidA: string,
  nameA: string,
  uidB: string,
  nameB: string
): Promise<string> {
  const id = conversationId(uidA, uidB);
  const ref = doc(db, CONVERSATIONS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uidA, uidB],
      participant_names: { [uidA]: nameA, [uidB]: nameB },
      last_message: null,
      last_message_at: null,
      created_at: serverTimestamp(),
    });
  }
  return id;
}

export async function fetchConversations(uid: string): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', uid),
    orderBy('last_message_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapConversation(d.id, d.data()));
}

// Admin oversight — every conversation platform-wide, most recent first.
export async function fetchAllConversations(): Promise<Conversation[]> {
  const q = query(collection(db, CONVERSATIONS_COLLECTION), orderBy('last_message_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapConversation(d.id, d.data()));
}

export async function sendMessage(
  conversationId: string,
  senderUid: string,
  text: string,
  media?: { url: string; type: MediaType }
): Promise<void> {
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  // Message text (and the conversation's last_message preview below) are
  // encrypted before they ever reach Firestore — see crypto.ts for what
  // this does and doesn't protect against.
  await setDoc(doc(collection(convRef, 'messages')), {
    sender_uid: senderUid,
    text: text ? encryptMessageText(text) : '',
    media_url: media?.url ?? null,
    media_type: media?.type ?? null,
    created_at: serverTimestamp(),
  });

  const preview = media ? (media.type === 'video' ? '🎥 Video' : '📷 Photo') : text;
  await setDoc(convRef, { last_message: encryptMessageText(preview), last_message_at: serverTimestamp() }, { merge: true });

  const convSnap = await getDoc(convRef);
  const conv = convSnap.exists() ? mapConversation(convSnap.id, convSnap.data()) : null;
  const otherUid = conv?.participants.find((p) => p !== senderUid);
  const senderName = conv?.participant_names[senderUid] ?? 'Someone';
  if (otherUid) {
    // Notification body deliberately doesn't repeat the message text —
    // keeps the same content out of the notifications collection too.
    await createNotification(otherUid, 'new_message', `New message from ${senderName}`, preview, conversationId);
  }
}

// Live-updating message list — messaging is the one place a snapshot
// listener earns its keep (a chat screen that only refreshes on pull isn't
// really a chat). Returns the unsubscribe function.
export function subscribeToMessages(conversationId: string, onChange: (messages: Message[]) => void): () => void {
  const q = query(
    collection(doc(db, CONVERSATIONS_COLLECTION, conversationId), 'messages'),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          sender_uid: data.sender_uid ?? '',
          text: data.text ? decryptMessageText(data.text) : '',
          media_url: data.media_url ?? null,
          media_type: data.media_type ?? null,
          created_at: toISO(data.created_at),
        };
      })
    );
  });
}

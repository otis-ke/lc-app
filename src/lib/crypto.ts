import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

// Encrypts chat message text before it's written to Firestore, so a raw
// browse of the database (or a leaked export) never shows plaintext
// conversations — this is app-level AES, not end-to-end: the app itself
// (and therefore admin's read-only chat oversight, per the brief) can
// always decrypt, since only the DB-at-rest needs to be unreadable, not
// the app's own authorized viewers.
//
// The key lives in the client bundle, same trust boundary as the Firebase
// config already shipped in lib/firebase.ts — anyone who can read the app's
// JS can read this key too. That's an inherent limit of any client-only
// encryption scheme without a backend; it still fully satisfies "encrypted
// at rest in the DB" against anyone who only has Firestore console/export
// access, which is the threat this feature targets.
const CHAT_SECRET = 'lc-modeling-academy-chat-v1';

export function encryptMessageText(plain: string): string {
  return AES.encrypt(plain, CHAT_SECRET).toString();
}

export function decryptMessageText(cipher: string): string {
  try {
    const bytes = AES.decrypt(cipher, CHAT_SECRET);
    const text = bytes.toString(Utf8);
    // Falls back to the raw value for older, pre-encryption messages (or
    // anything that fails to decrypt) rather than showing a blank bubble.
    return text || cipher;
  } catch {
    return cipher;
  }
}

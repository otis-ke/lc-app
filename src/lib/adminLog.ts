import { collection, doc, getDocs, limit as fbLimit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import type { AdminActionType, AdminAuditEntry } from '../types';

// A durable trail of every approve/reject/finance decision an admin makes —
// "logs and all" per the brief — separate from the live state on each
// instructor/student record, which only ever shows the CURRENT decision.
const COLLECTION = 'admin_audit_log';

function mapEntry(id: string, data: Record<string, any>): AdminAuditEntry {
  return {
    id,
    action: data.action ?? 'instructor_approved',
    target_type: data.target_type ?? 'instructor',
    target_uid: data.target_uid ?? '',
    target_name: data.target_name ?? '',
    performed_by_uid: data.performed_by_uid ?? '',
    performed_by_name: data.performed_by_name ?? 'Admin',
    note: data.note ?? null,
    created_at: toISO(data.created_at),
  };
}

export async function logAdminAction(input: {
  action: AdminActionType;
  targetType: 'instructor' | 'student';
  targetUid: string;
  targetName: string;
  performedByUid: string;
  performedByName: string;
  note?: string | null;
}): Promise<void> {
  try {
    await setDoc(doc(collection(db, COLLECTION)), {
      action: input.action,
      target_type: input.targetType,
      target_uid: input.targetUid,
      target_name: input.targetName,
      performed_by_uid: input.performedByUid,
      performed_by_name: input.performedByName,
      note: input.note ?? null,
      created_at: serverTimestamp(),
    });
  } catch {
    // best-effort — a logging failure should never block the real action
  }
}

export async function fetchAuditLog(max = 200): Promise<AdminAuditEntry[]> {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapEntry(d.id, d.data()));
}

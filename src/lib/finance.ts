import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import { mapModelProfile } from './models';
import type { AppModelProfile, FinanceLedgerEntry, LedgerEntryType, PaymentStatus } from '../types';

const LEDGER_COLLECTION = 'finance_ledger';
const MODEL_PROFILES_COLLECTION = 'app_model_profiles';

function mapLedgerEntry(id: string, data: Record<string, any>): FinanceLedgerEntry {
  return {
    id,
    student_uid: data.student_uid ?? '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    type: data.type ?? 'adjustment',
    note: data.note ?? '',
    recorded_by_uid: data.recorded_by_uid ?? '',
    recorded_by_name: data.recorded_by_name ?? '',
    created_at: toISO(data.created_at),
  };
}

export async function fetchLedgerForStudent(studentUid: string): Promise<FinanceLedgerEntry[]> {
  const q = query(
    collection(db, LEDGER_COLLECTION),
    where('student_uid', '==', studentUid),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapLedgerEntry(d.id, d.data()));
}

// Admin action: records a ledger entry and atomically applies it to the
// student's running balance, so the two can never drift apart.
export async function recordLedgerEntry(input: {
  studentUid: string;
  studentName: string;
  amount: number;
  type: LedgerEntryType;
  note: string;
  recordedByUid: string;
  recordedByName: string;
}): Promise<void> {
  const profileRef = doc(db, MODEL_PROFILES_COLLECTION, input.studentUid);
  const ledgerRef = doc(collection(db, LEDGER_COLLECTION));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(profileRef);
    const prevBalance = snap.exists() && typeof snap.data().balance === 'number' ? snap.data().balance : 0;
    tx.set(ledgerRef, {
      student_uid: input.studentUid,
      amount: input.amount,
      type: input.type,
      note: input.note,
      recorded_by_uid: input.recordedByUid,
      recorded_by_name: input.recordedByName,
      created_at: serverTimestamp(),
    });
    tx.set(profileRef, { balance: prevBalance + input.amount }, { merge: true });
  });

  await createNotification(
    input.studentUid,
    'finance_update',
    input.amount >= 0 ? 'Payment recorded' : 'Balance updated',
    `${input.note} (${input.amount >= 0 ? '+' : ''}KSh ${input.amount.toLocaleString()})`
  );
}

export async function setPaymentStatus(studentUid: string, status: PaymentStatus): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, MODEL_PROFILES_COLLECTION, studentUid);
    tx.set(ref, { payment_status: status }, { merge: true });
  });
}

// Admin oversight — every model account, most recently updated first.
export async function fetchAllStudents(): Promise<AppModelProfile[]> {
  const q = query(collection(db, MODEL_PROFILES_COLLECTION), orderBy('updated_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapModelProfile(d.id, d.data()));
}

// Super admin platform-wide rollup — total collected (every "payment" type
// ledger entry ever recorded) and total outstanding (sum of every negative
// student balance).
export async function fetchFinanceSummary(): Promise<{ totalCollected: number; totalOutstanding: number; studentCount: number }> {
  const [studentsSnap, ledgerSnap] = await Promise.all([
    getDocs(collection(db, MODEL_PROFILES_COLLECTION)),
    getDocs(query(collection(db, LEDGER_COLLECTION), where('type', '==', 'payment'))),
  ]);

  let totalOutstanding = 0;
  studentsSnap.docs.forEach((d) => {
    const balance = typeof d.data().balance === 'number' ? d.data().balance : 0;
    if (balance < 0) totalOutstanding += Math.abs(balance);
  });

  let totalCollected = 0;
  ledgerSnap.docs.forEach((d) => {
    const amount = typeof d.data().amount === 'number' ? d.data().amount : 0;
    if (amount > 0) totalCollected += amount;
  });

  return { totalCollected, totalOutstanding, studentCount: studentsSnap.size };
}

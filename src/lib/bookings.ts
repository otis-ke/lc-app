import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import type { Booking, BookingStatus, InstructorMode } from '../types';
import { PLATFORM_COMMISSION_RATE } from '../types';

const COLLECTION = 'bookings';

function mapBooking(id: string, data: Record<string, any>): Booking {
  return {
    id,
    model_uid: data.model_uid ?? '',
    model_name: data.model_name ?? '',
    instructor_uid: data.instructor_uid ?? '',
    instructor_name: data.instructor_name ?? '',
    course: data.course ?? '',
    mode: data.mode ?? 'online',
    date: data.date ?? '',
    time_slot: data.time_slot ?? '',
    price: typeof data.price === 'number' ? data.price : 0,
    commission_amount: typeof data.commission_amount === 'number' ? data.commission_amount : 0,
    instructor_earning: typeof data.instructor_earning === 'number' ? data.instructor_earning : 0,
    booking_status: data.booking_status ?? 'requested',
    created_at: toISO(data.created_at),
  };
}

export interface CreateBookingInput {
  model_uid: string;
  model_name: string;
  instructor_uid: string;
  instructor_name: string;
  course: string;
  mode: InstructorMode;
  date: string;
  time_slot: string;
  price: number;
}

// Computes the 20/80 platform commission split here, once, so every reader
// (instructor earnings, admin revenue totals) trusts the same numbers
// instead of recomputing price * 0.2 in multiple screens.
export async function createBooking(input: CreateBookingInput): Promise<string> {
  const commission_amount = Math.round(input.price * PLATFORM_COMMISSION_RATE);
  const instructor_earning = input.price - commission_amount;
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    ...input,
    commission_amount,
    instructor_earning,
    booking_status: 'requested',
    created_at: serverTimestamp(),
  });
  await createNotification(
    input.instructor_uid,
    'booking_requested',
    'New booking request',
    `${input.model_name} requested ${input.course} on ${input.date} at ${input.time_slot}.`
  );
  return ref.id;
}

export async function fetchBookingsForModel(uid: string): Promise<Booking[]> {
  const q = query(collection(db, COLLECTION), where('model_uid', '==', uid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapBooking(d.id, d.data()));
}

export async function fetchBookingsForInstructor(uid: string): Promise<Booking[]> {
  const q = query(collection(db, COLLECTION), where('instructor_uid', '==', uid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapBooking(d.id, d.data()));
}

const STATUS_COPY: Record<BookingStatus, { title: string; body: (b: Booking) => string }> = {
  requested: { title: 'Booking requested', body: () => '' },
  confirmed: {
    title: 'Booking confirmed',
    body: (b) => `${b.instructor_name} confirmed your ${b.course} session on ${b.date} at ${b.time_slot}.`,
  },
  rejected: {
    title: 'Booking declined',
    body: (b) => `${b.instructor_name} couldn't take your ${b.course} session on ${b.date}. Try another slot.`,
  },
  completed: {
    title: 'Session completed',
    body: (b) => `Your ${b.course} session with ${b.instructor_name} is marked complete — leave a review!`,
  },
  cancelled: {
    title: 'Booking cancelled',
    body: (b) => `The ${b.course} session on ${b.date} was cancelled.`,
  },
};

// The instructor accepts/rejects/completes; the model can cancel. Whoever
// isn't the actor gets notified.
export async function updateBookingStatus(booking: Booking, status: BookingStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, booking.id), { booking_status: status });
  const updated = { ...booking, booking_status: status };
  const copy = STATUS_COPY[status];
  if (!copy.body(updated)) return;
  const notifyUid = status === 'cancelled' ? booking.instructor_uid : booking.model_uid;
  await createNotification(notifyUid, `booking_${status}`, copy.title, copy.body(updated), booking.id);
}

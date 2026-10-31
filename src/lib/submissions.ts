import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { notifyAllAdmins } from './notifications';

// The original site only ever emailed these forms via EmailJS — nothing was
// queryable afterwards. We persist them as new collections in the same
// Firestore project instead, so the admin dashboard has a real inbox.
// Same exported function names/signatures as before so screens don't change.
async function insertRow(collectionName: string, row: Record<string, unknown>) {
  await addDoc(collection(db, collectionName), {
    ...row,
    status: 'new',
    created_at: serverTimestamp(),
  });
}

export const submitScoutingApplication = (row: Record<string, unknown>) =>
  insertRow('scouting_applications', row);

export const submitClassSignup = (row: Record<string, unknown>) => insertRow('class_signups', row);

export const submitModelBooking = (row: Record<string, unknown>) => insertRow('model_bookings', row);

export const submitEnrollment = (row: Record<string, unknown>) => insertRow('enrollments', row);

export async function submitInstructorApplication(row: Record<string, unknown>) {
  await insertRow('instructor_applications', row);
  const name = typeof row.full_name === 'string' ? row.full_name : 'Someone';
  await notifyAllAdmins(
    'new_instructor_application',
    'New instructor application',
    `${name} applied to become an instructor — review it in Approvals.`
  ).catch(() => {});
}

export const submitInstructorBooking = (row: Record<string, unknown>) =>
  insertRow('instructor_bookings', row);

export const submitModelEnquiry = (row: Record<string, unknown>) => insertRow('model_enquiries', row);

export const submitContactMessage = (row: Record<string, unknown>) => insertRow('contact_messages', row);

export const submitPartnershipRequest = (row: Record<string, unknown>) =>
  insertRow('partnership_requests', row);

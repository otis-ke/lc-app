import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { toISO } from './content';
import { createNotification } from './notifications';
import type { Certificate } from '../types';

const COLLECTION = 'certificates';

function mapCertificate(id: string, data: Record<string, any>): Certificate {
  return {
    id,
    certificate_number: data.certificate_number ?? '',
    model_uid: data.model_uid ?? '',
    model_name: data.model_name ?? '',
    course: data.course ?? '',
    instructor_name: data.instructor_name ?? '',
    completion_date: data.completion_date ?? '',
    created_at: toISO(data.created_at),
  };
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `LC-${year}-${random}`;
}

export interface IssueCertificateInput {
  model_uid: string;
  model_name: string;
  course: string;
  instructor_name: string;
  completion_date: string;
}

export async function issueCertificate(input: IssueCertificateInput): Promise<string> {
  const certificate_number = generateCertificateNumber();
  await setDoc(doc(collection(db, COLLECTION)), {
    ...input,
    certificate_number,
    created_at: serverTimestamp(),
  });
  await createNotification(
    input.model_uid,
    'certificate_issued',
    'Certificate issued',
    `You've earned a certificate for ${input.course} — verification code ${certificate_number}.`
  );
  return certificate_number;
}

export async function fetchCertificatesForModel(uid: string): Promise<Certificate[]> {
  const q = query(collection(db, COLLECTION), where('model_uid', '==', uid), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCertificate(d.id, d.data()));
}

export async function verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
  const q = query(collection(db, COLLECTION), where('certificate_number', '==', certificateNumber.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return mapCertificate(snap.docs[0].id, snap.docs[0].data());
}

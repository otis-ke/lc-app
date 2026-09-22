// Data model — mirrors the site's real Firestore collections (see
// src/lib/content.ts for the mapping) plus new collections for form
// submissions that used to be EmailJS-only. See README "Data model" section
// for the full mapping back to the original site.

export type Role = 'user' | 'admin';
export type AccountType = 'model' | 'instructor' | 'brand';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  account_type: AccountType | null;
  push_token: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  header_image: string | null;
  content: string[]; // one paragraph per entry, was Firestore content[].value
  published_on: string;
  created_at: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  header_image: string | null;
  images: string[];
  text_description: string | null;
  full_description: string | null;
  publish_date: string;
  created_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  header_image: string | null;
  content_images: string[];
  location: string | null;
  specialization: string | null;
  experience_years: number | null;
  fee_notes: string | null;
  description: string;
  created_at: string;
}

export type SubmissionStatus = 'new' | 'reviewed' | 'contacted' | 'closed';

export interface ScoutingApplication {
  id: string;
  full_name: string;
  email: string;
  telephone: string;
  age: number;
  nationality: string;
  county: string;
  gender: 'Male' | 'Female' | 'Other';
  height: string | null;
  weight: string | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  shoe_size: string | null;
  hair_color: string | null;
  eye_color: string | null;
  social_handle: string | null;
  modeling_experience: 'None' | 'Beginner' | 'Intermediate' | 'Professional';
  areas_of_interest: string[];
  headshot_url: string | null;
  full_body_front_url: string | null;
  full_body_side_url: string | null;
  walking_video_url: string | null;
  about: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface ClassSignup {
  id: string;
  full_name: string;
  email: string;
  telephone: string;
  nationality: string;
  county: string;
  preferred_course: string;
  start_date: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface ModelBookingRequest {
  id: string;
  full_name: string;
  email: string;
  telephone: string;
  nationality: string;
  project_details: string;
  model_category_needed: string[];
  status: SubmissionStatus;
  created_at: string;
}

export interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  telephone: string;
  nationality: string;
  county: string;
  age: number;
  gender: string;
  id_number: string;
  course: string;
  start_date: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface InstructorApplication {
  id: string;
  uid: string | null; // set when the applicant is signed in — required to approve into an app_instructor_profiles doc
  full_name: string;
  phone: string;
  email: string;
  country: string;
  location: string;
  experience_years: number | null;
  specialization: string;
  socials: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export interface InstructorBookingRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  location: string;
  training: string;
  instructor_name: string | null;
  method: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface ModelEnquiry {
  id: string;
  model_id: string | null;
  model_name: string;
  user_name: string;
  user_email: string;
  user_telephone: string;
  enquire_type: 'Enquire about model' | 'Book model';
  message: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  message: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface PartnershipRequest {
  id: string;
  org_name: string;
  email: string;
  telephone: string;
  partnership_type: string;
  message: string;
  status: SubmissionStatus;
  created_at: string;
}

// ------------------------------------------------------- Marketplace ------
// Self-serve collections (app_*) are separate from the site-managed
// lc_models_management / lc_model_connect_instructors rosters above —
// keeping them apart means the website's own curated roster/CMS is never
// touched by a user editing their own app profile.

export interface DevelopmentProgress {
  catwalk: number;
  posing: number;
  confidence: number;
  grooming: number;
  pageantry: number;
  commercial_modeling: number;
}

export const EMPTY_DEVELOPMENT: DevelopmentProgress = {
  catwalk: 0,
  posing: 0,
  confidence: 0,
  grooming: 0,
  pageantry: 0,
  commercial_modeling: 0,
};

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface AppModelProfile {
  id: string; // = uid
  full_name: string;
  age: number | null;
  location: string | null;
  height_cm: number | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  shoe_size: string | null;
  categories: string[]; // runway, commercial, high fashion, pageantry, child modeling...
  bio: string;
  skills: string[];
  photos: string[];
  social_instagram: string | null;
  social_tiktok: string | null;
  social_other: string | null;
  availability_notes: string | null;
  development: DevelopmentProgress;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  balance: number; // KSh; positive = credit, negative = owed to the school
  payment_status: PaymentStatus;
  geo: GeoPoint | null;
  created_at: string;
  updated_at: string;
}

export type InstructorMode = 'online' | 'in_person' | 'both';

export interface AvailabilitySlot {
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface GeoPoint {
  lat: number;
  lng: number;
  updated_at: string;
}

export interface AppInstructorProfile {
  id: string; // = uid
  full_name: string;
  bio: string;
  specialties: string[];
  location: string | null;
  geo: GeoPoint | null;
  mode: InstructorMode;
  price_per_session: number;
  experience_years: number | null;
  photos: string[];
  availability: AvailabilitySlot[];
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface AppBrandProfile {
  id: string; // = uid
  company_name: string;
  contact_name: string | null;
  industry: string | null;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  created_at: string;
}

export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export const PLATFORM_COMMISSION_RATE = 0.2; // L&C keeps 20%, instructor keeps 80%

export interface Booking {
  id: string;
  model_uid: string;
  model_name: string;
  instructor_uid: string;
  instructor_name: string;
  course: string;
  mode: InstructorMode;
  date: string; // ISO date (yyyy-mm-dd)
  time_slot: string; // "HH:mm"
  price: number;
  commission_amount: number;
  instructor_earning: number;
  booking_status: BookingStatus;
  created_at: string;
}

export type CastingStatus = 'open' | 'closed';
export type CastingPosterType = 'brand' | 'admin';

export interface Casting {
  id: string;
  posted_by_uid: string;
  posted_by_name: string;
  posted_by_type: CastingPosterType;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string | null;
  compensation: string | null;
  status: CastingStatus;
  created_at: string;
}

export type CastingApplicationStatus = 'submitted' | 'shortlisted' | 'accepted' | 'rejected';

export interface CastingApplication {
  id: string;
  casting_id: string;
  casting_title: string;
  model_uid: string;
  model_name: string;
  message: string;
  status: CastingApplicationStatus;
  created_at: string;
}

export type ReviewTargetType = 'instructor' | 'model';

export interface Review {
  id: string;
  booking_id: string | null;
  target_type: ReviewTargetType;
  target_uid: string;
  target_name: string;
  author_uid: string;
  author_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export interface Conversation {
  id: string; // `${uidA}_${uidB}` sorted lexicographically
  participants: [string, string];
  participant_names: Record<string, string>;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export type MediaType = 'image' | 'video';

export interface Message {
  id: string;
  sender_uid: string;
  text: string;
  media_url: string | null;
  media_type: MediaType | null;
  created_at: string;
}

export type NotificationType =
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'casting_application'
  | 'casting_status'
  | 'instructor_approved'
  | 'profile_approved'
  | 'new_message'
  | 'certificate_issued'
  | 'withdrawal_update'
  | 'finance_update'
  | 'course_unlocked';

export interface AppNotification {
  id: string;
  user_uid: string;
  type: NotificationType;
  title: string;
  body: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string; // e.g. LC-2026-483920
  model_uid: string;
  model_name: string;
  course: string;
  instructor_name: string;
  completion_date: string;
  created_at: string;
}

export type WithdrawalStatus = 'requested' | 'paid' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  instructor_uid: string;
  instructor_name: string;
  amount: number;
  status: WithdrawalStatus;
  requested_at: string;
}

// ---------------------------------------------------------- L&C Academy ---
// Courses/lessons run by the school itself (distinct from one-off instructor
// bookings above). Access is gated by a manual payment confirmation from
// admin — no in-app payment collection, students pay the school directly.

export type LedgerEntryType = 'payment' | 'adjustment' | 'charge';

export interface FinanceLedgerEntry {
  id: string;
  student_uid: string;
  amount: number; // positive = credited to the student, negative = charged
  type: LedgerEntryType;
  note: string;
  recorded_by_uid: string;
  recorded_by_name: string;
  created_at: string;
}

export type CourseStatus = 'draft' | 'published';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_uid: string | null;
  instructor_name: string | null;
  price: number;
  cover_image: string | null;
  status: CourseStatus;
  lesson_count: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  notes: string | null;
  order: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  course_title: string;
  student_uid: string;
  student_name: string;
  paid: boolean;
  amount_paid: number;
  enrolled_at: string;
}

import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  HomeMain: undefined;
  Programs: undefined;
  Enroll: { course?: string } | undefined;
  HomeCoaching: undefined;
  Contact: undefined;
  Partner: undefined;
};

export type ModelsStackParamList = {
  ModelsHub: { tab?: 'roster' | 'scouted' | 'book' | 'classes' } | undefined;
  ModelDetail: { modelId: string };
  GetScouted: undefined;
  BookModel: undefined;
  OnlineClassSignup: undefined;
};

export type ConnectStackParamList = {
  ConnectHome: undefined;
  // Website-managed roster (lc_model_connect_instructors, read-only, no uid) — leads to the lead-form BookTraining flow.
  InstructorDetail: { instructorId: string };
  BecomeInstructor: undefined;
  BookTraining: { instructorName?: string } | undefined;
  // App's own self-serve, bookable instructor directory (app_instructor_profiles, keyed by uid).
  InstructorProfileDetail: { uid: string };
  SelectSlot: { instructorUid: string; instructorName: string };
  BookingConfirmed: { bookingId: string; course: string; date: string; timeSlot: string; price: number };
  NearbyMap: undefined;
};

export type BlogStackParamList = {
  BlogList: undefined;
  BlogDetail: { postId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Login: undefined;
  SignUp: undefined;
  // AdminHome embeds the website's own admin.html (WebView) — one admin
  // implementation shared by web and app, see AdminHomeScreen.tsx.
  AdminHome: undefined;
};

// Everything account-type-specific (model/instructor/brand self-service)
// lives in one stack behind a single "Dashboard" tab, rather than being
// scattered across the content-browsing tabs above.
export type DashboardStackParamList = {
  DashboardHome: undefined;

  // Model
  MyPortfolio: undefined;
  DevelopmentTracker: { modelUid?: string } | undefined; // no param = "my own"
  MyCertificates: undefined;
  MyBookings: undefined;
  MyCastingApplications: undefined;

  // Instructor
  InstructorProfileEdit: undefined;
  InstructorAvailability: undefined;
  InstructorDashboardBookings: undefined;
  InstructorEarnings: undefined;
  InstructorStudentDevelopment: { modelUid: string; modelName: string };

  // Shared
  LeaveReview: {
    bookingId: string;
    targetType: 'instructor' | 'model';
    targetUid: string;
    targetName: string;
  };
  IssueCertificate: { bookingId: string; modelUid: string; modelName: string; course: string; instructorName: string };
  VerifyCertificate: undefined;

  // Brand / castings
  BrandProfile: undefined;
  PostCasting: undefined;
  MyCastings: undefined;
  CastingApplicants: { castingId: string; castingTitle: string };
  CastingsBoard: undefined;
  CastingDetail: { castingId: string };

  // Messaging
  Conversations: undefined;
  Chat: { otherUid: string; otherName: string };

  // Notifications
  Notifications: undefined;

  // Finance (student self-view)
  MyFinance: undefined;

  // L&C Academy (courses/lessons)
  Courses: undefined;
  CourseDetail: { courseId: string; courseTitle: string };
  LessonPlayer: { courseId: string; lessonId: string; lessonTitle: string; videoUrl: string };

  // Admin business dashboard (native — separate from the WebView content admin)
  AdminOverview: undefined;
  AdminApprovals: undefined;
  InstructorApplicationDetail: { applicationId: string };
  AdminWithdrawals: undefined;
  AdminStudents: undefined;
  AdminStudentFinance: { studentUid: string; studentName: string };
  AdminChats: undefined;
  AdminChatView: { conversationId: string; title: string };
  AdminCourses: undefined;
  AdminCourseEditor: { courseId?: string } | undefined;
  AdminAuditLog: undefined;
  AdminAnalytics: undefined;
  SuperAdmin: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ModelsTab: NavigatorScreenParams<ModelsStackParamList>;
  ConnectTab: NavigatorScreenParams<ConnectStackParamList>;
  BlogTab: NavigatorScreenParams<BlogStackParamList>;
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

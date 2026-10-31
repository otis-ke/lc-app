import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from './types';
import { useScreenOptions } from './navOptions';
import DashboardHomeScreen from '../screens/dashboard/DashboardHomeScreen';
import MyPortfolioScreen from '../screens/dashboard/MyPortfolioScreen';
import InstructorProfileEditScreen from '../screens/dashboard/InstructorProfileEditScreen';
import InstructorAvailabilityScreen from '../screens/dashboard/InstructorAvailabilityScreen';
import BrandProfileScreen from '../screens/dashboard/BrandProfileScreen';
import MyBookingsScreen from '../screens/dashboard/MyBookingsScreen';
import InstructorDashboardBookingsScreen from '../screens/dashboard/InstructorDashboardBookingsScreen';
import InstructorEarningsScreen from '../screens/dashboard/InstructorEarningsScreen';
import InstructorStudentDevelopmentScreen from '../screens/dashboard/InstructorStudentDevelopmentScreen';
import DevelopmentTrackerScreen from '../screens/dashboard/DevelopmentTrackerScreen';
import LeaveReviewScreen from '../screens/dashboard/LeaveReviewScreen';
import CastingsBoardScreen from '../screens/dashboard/CastingsBoardScreen';
import CastingDetailScreen from '../screens/dashboard/CastingDetailScreen';
import PostCastingScreen from '../screens/dashboard/PostCastingScreen';
import MyCastingsScreen from '../screens/dashboard/MyCastingsScreen';
import CastingApplicantsScreen from '../screens/dashboard/CastingApplicantsScreen';
import MyCastingApplicationsScreen from '../screens/dashboard/MyCastingApplicationsScreen';
import ConversationsListScreen from '../screens/dashboard/ConversationsListScreen';
import ChatScreen from '../screens/dashboard/ChatScreen';
import NotificationsScreen from '../screens/dashboard/NotificationsScreen';
import IssueCertificateScreen from '../screens/dashboard/IssueCertificateScreen';
import MyCertificatesScreen from '../screens/dashboard/MyCertificatesScreen';
import VerifyCertificateScreen from '../screens/dashboard/VerifyCertificateScreen';
import AdminOverviewScreen from '../screens/admin/AdminOverviewScreen';
import AdminApprovalsScreen from '../screens/admin/AdminApprovalsScreen';
import InstructorApplicationDetailScreen from '../screens/admin/InstructorApplicationDetailScreen';
import AdminAuditLogScreen from '../screens/admin/AdminAuditLogScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminWithdrawalsScreen from '../screens/admin/AdminWithdrawalsScreen';
import AdminStudentsScreen from '../screens/admin/AdminStudentsScreen';
import AdminStudentFinanceScreen from '../screens/admin/AdminStudentFinanceScreen';
import AdminChatsScreen from '../screens/admin/AdminChatsScreen';
import AdminChatViewScreen from '../screens/admin/AdminChatViewScreen';
import MyFinanceScreen from '../screens/dashboard/MyFinanceScreen';
import CoursesScreen from '../screens/dashboard/CoursesScreen';
import CourseDetailScreen from '../screens/dashboard/CourseDetailScreen';
import LessonPlayerScreen from '../screens/dashboard/LessonPlayerScreen';
import AdminCoursesScreen from '../screens/admin/AdminCoursesScreen';
import AdminCourseEditorScreen from '../screens/admin/AdminCourseEditorScreen';
import SuperAdminScreen from '../screens/admin/SuperAdminScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={useScreenOptions()}>
      <Stack.Screen name="DashboardHome" component={DashboardHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyPortfolio" component={MyPortfolioScreen} options={{ title: 'My Portfolio' }} />
      <Stack.Screen
        name="InstructorProfileEdit"
        component={InstructorProfileEditScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="InstructorAvailability"
        component={InstructorAvailabilityScreen}
        options={{ title: 'Availability' }}
      />
      <Stack.Screen name="BrandProfile" component={BrandProfileScreen} options={{ title: 'Company Profile' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen
        name="InstructorDashboardBookings"
        component={InstructorDashboardBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <Stack.Screen name="InstructorEarnings" component={InstructorEarningsScreen} options={{ title: 'Earnings' }} />
      <Stack.Screen
        name="InstructorStudentDevelopment"
        component={InstructorStudentDevelopmentScreen}
        options={{ title: 'Student Progress' }}
      />
      <Stack.Screen name="DevelopmentTracker" component={DevelopmentTrackerScreen} options={{ title: 'My Development' }} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Leave a Review' }} />
      <Stack.Screen name="CastingsBoard" component={CastingsBoardScreen} options={{ title: 'Castings & Jobs' }} />
      <Stack.Screen name="CastingDetail" component={CastingDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="PostCasting" component={PostCastingScreen} options={{ title: 'Post a Casting' }} />
      <Stack.Screen name="MyCastings" component={MyCastingsScreen} options={{ title: 'My Castings' }} />
      <Stack.Screen name="CastingApplicants" component={CastingApplicantsScreen} options={{ title: 'Applicants' }} />
      <Stack.Screen
        name="MyCastingApplications"
        component={MyCastingApplicationsScreen}
        options={{ title: 'My Applications' }}
      />
      <Stack.Screen name="Conversations" component={ConversationsListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.otherName })} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="MyFinance" component={MyFinanceScreen} options={{ title: 'My Finance' }} />
      <Stack.Screen name="Courses" component={CoursesScreen} options={{ title: 'L&C Academy' }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={({ route }) => ({ title: route.params.courseTitle })} />
      <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} options={({ route }) => ({ title: route.params.lessonTitle })} />
      <Stack.Screen name="IssueCertificate" component={IssueCertificateScreen} options={{ title: 'Issue Certificate' }} />
      <Stack.Screen name="MyCertificates" component={MyCertificatesScreen} options={{ title: 'My Certificates' }} />
      <Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} options={{ title: 'Verify Certificate' }} />
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} options={{ title: 'Business Overview' }} />
      <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} options={{ title: 'Approvals' }} />
      <Stack.Screen name="InstructorApplicationDetail" component={InstructorApplicationDetailScreen} options={{ title: 'Application' }} />
      <Stack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} options={{ title: 'Audit Log' }} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="AdminWithdrawals" component={AdminWithdrawalsScreen} options={{ title: 'Withdrawals' }} />
      <Stack.Screen name="AdminStudents" component={AdminStudentsScreen} options={{ title: 'Students' }} />
      <Stack.Screen name="AdminStudentFinance" component={AdminStudentFinanceScreen} options={({ route }) => ({ title: route.params.studentName })} />
      <Stack.Screen name="AdminChats" component={AdminChatsScreen} options={{ title: 'Conversations' }} />
      <Stack.Screen name="AdminChatView" component={AdminChatViewScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="AdminCourses" component={AdminCoursesScreen} options={{ title: 'Courses' }} />
      <Stack.Screen name="AdminCourseEditor" component={AdminCourseEditorScreen} options={{ title: 'Course Editor' }} />
      <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} options={{ title: 'Super Admin' }} />
    </Stack.Navigator>
  );
}

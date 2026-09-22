import type Ionicons from '@expo/vector-icons/Ionicons';
import type { NotificationType } from '../types';

// Shared between NotificationsScreen (the feed) and NotificationToast (the
// live pop-up) so both ever agree on iconography.
export const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  booking_requested: 'calendar-outline',
  booking_confirmed: 'checkmark-circle-outline',
  booking_rejected: 'close-circle-outline',
  booking_completed: 'ribbon-outline',
  booking_cancelled: 'close-circle-outline',
  casting_application: 'briefcase-outline',
  casting_status: 'briefcase-outline',
  instructor_approved: 'school-outline',
  profile_approved: 'checkmark-done-outline',
  new_message: 'chatbubble-outline',
  certificate_issued: 'medal-outline',
  withdrawal_update: 'cash-outline',
  finance_update: 'wallet-outline',
  course_unlocked: 'play-circle-outline',
};

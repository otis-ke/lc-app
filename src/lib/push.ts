import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Real OS push, sent straight from the client to Expo's push API — no
// backend needed, same "reuse what's free" approach as the rest of the app
// (see notifications.ts). Delivery on Android still needs one one-time setup
// step outside this codebase: an EAS project id (`npx eas init`) so Expo can
// mint push tokens, since this app is built locally via gradlew rather than
// `eas build`. Until that's done, registerForPushToken() safely resolves to
// null and the app keeps working on the in-app notification feed alone.
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // push tokens aren't meaningful on a simulator

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
    if (!projectId) return null; // no EAS project configured yet — see comment above

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch {
    return null; // push is a nice-to-have on top of the in-app feed, never a blocker
  }
}

export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, any>) {
  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
    });
  } catch {
    // best-effort — same rationale as createNotification()
  }
}

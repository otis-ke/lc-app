import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export type LocationResult =
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'unavailable'; message: string };

// Shared by every "Use My Location" / nearby-people entry point so they all
// behave the same way: never auto-prompt without a tap (browsers are prone
// to treating an unsolicited request as spam and auto-denying it, which
// then poisons the permission for every later attempt too — see
// requestLocationFromGesture below), and give a specific, actionable reason
// when it fails instead of a bare "denied".
export async function requestLocationFromGesture(): Promise<LocationResult> {
  try {
    let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted' && canAskAgain) {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
      canAskAgain = req.canAskAgain;
    }
    if (status !== 'granted') {
      return { status: 'denied', canAskAgain };
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { status: 'granted', lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (e: any) {
    return { status: 'unavailable', message: e?.message ?? 'Could not get your location.' };
  }
}

// Read-only check — never shows a permission prompt. Safe to call on
// screen load (e.g. to silently sort a list by distance if permission was
// already granted earlier), unlike requestLocationFromGesture which must
// only ever run from a tap.
export async function getLocationIfAlreadyGranted(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

export function describeLocationDenial(canAskAgain: boolean): string {
  if (Platform.OS === 'web') {
    return "Location is blocked for this site. Click the location/lock icon in your browser's address bar, allow location, then try again.";
  }
  if (!canAskAgain) {
    return 'Location access was turned off for this app. Enable it in your device Settings, then try again.';
  }
  return 'Location permission was declined. Try again and choose "Allow" when prompted.';
}

// Opens the OS app-settings page where location permission lives — only
// useful once canAskAgain is false (the in-app prompt won't show again).
export function openLocationSettings() {
  if (Platform.OS === 'web') return;
  Linking.openSettings().catch(() => {});
}

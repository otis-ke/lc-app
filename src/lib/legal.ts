import { Linking } from 'react-native';

export const PRIVACY_POLICY_URL = 'https://lcmodelingschool.com/privacy-policy.html';

export function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_POLICY_URL);
}

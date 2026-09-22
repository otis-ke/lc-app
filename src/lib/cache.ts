import AsyncStorage from '@react-native-async-storage/async-storage';

// Tiny disk cache (AsyncStorage-backed) for whatever the last successful
// Firestore fetch returned, keyed per collection. Lets fetchBlogPosts() /
// fetchModels() / fetchInstructors() in content.ts fall back to "last known
// good" data when the device is offline, instead of showing an empty state
// for content the user has already seen once.
const PREFIX = 'lc-cache:';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // best-effort only — a full cache write failure shouldn't break the fetch
  }
}

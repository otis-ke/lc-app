import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-expect-error — exists at runtime in the RN bundle; missing from the
// public .d.ts in this firebase version (known upstream typing gap).
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Same live Firebase project the website (schoolcms-77713) already runs on —
// this is a client-side API key (safe to ship, protected by Firestore
// security rules, not a secret), copied verbatim from blog.js /
// modelsmanagement.js / modelconnect.js so this app reads/writes the site's
// real content instead of a separate empty database.
const firebaseConfig = {
  apiKey: 'AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nksM',
  authDomain: 'schoolcms-77713.firebaseapp.com',
  projectId: 'schoolcms-77713',
  storageBucket: 'schoolcms-77713.appspot.com',
  messagingSenderId: '757700374571',
  appId: '1:757700374571:web:a86b334d619cf160fa7a6e',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Web (react-native-web, used for the browser preview) doesn't support
// getReactNativePersistence — fall back to the default web persistence there.
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

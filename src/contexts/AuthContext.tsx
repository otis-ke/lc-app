import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { registerForPushToken } from '../lib/push';
import { notifyAllAdmins } from '../lib/notifications';
import type { AccountType, Profile } from '../types';

// New collection (doesn't exist on the original site — it never had real
// user accounts, only a hardcoded admin password check in loginform.html).
// Lives in the same Firestore project as everything else; doc id = auth uid.
const USERS_COLLECTION = 'app_users';

// Emails that are always granted admin the moment they sign in successfully —
// no manual Firestore edit needed. Super admin gets every admin privilege
// plus the dedicated Super Admin dashboard.
const OWNER_ADMIN_EMAILS = ['modelinglc@gmail.com', 'linkosiclothing@gmail.com', 'vincentotiskisia@gmail.com'];
const SUPER_ADMIN_EMAIL = 'vincentotiskisia@gmail.com';

interface AuthContextValue {
  session: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    accountType: AccountType | null
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAccountType: (accountType: AccountType) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Owner-admin check always keys off the real Firebase Auth email (normalized,
  // guaranteed lowercase by Firebase) — never the app_users doc's own `email`
  // field, which could be missing, stale, or saved with different casing than
  // what the user actually signed in with.
  async function loadProfile(uid: string, authEmail: string | null) {
    const ref = doc(db, USERS_COLLECTION, uid);
    let snap = await getDoc(ref);
    const normalizedEmail = (authEmail ?? '').toLowerCase();
    const shouldBeAdmin = OWNER_ADMIN_EMAILS.includes(normalizedEmail);

    if (!snap.exists()) {
      // A signed-in Firebase Auth user with no app_users doc yet (e.g. an
      // account created before this collection existed) — create one now
      // instead of silently leaving profile null.
      await setDoc(ref, {
        email: authEmail ?? '',
        full_name: null,
        role: shouldBeAdmin ? 'admin' : 'user',
        account_type: null,
        created_at: serverTimestamp(),
      });
      snap = await getDoc(ref);
    } else if (shouldBeAdmin && snap.data().role !== 'admin') {
      await setDoc(ref, { role: 'admin' }, { merge: true });
      snap = await getDoc(ref);
    }
    setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as Profile) : null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSession(user);
      if (user) {
        await loadProfile(user.uid, user.email);
        registerForPushToken()
          .then((token) => {
            if (token) return setDoc(doc(db, USERS_COLLECTION, user.uid), { push_token: token }, { merge: true });
          })
          .catch(() => {});
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      isSuperAdmin: (session?.email ?? '').toLowerCase() === SUPER_ADMIN_EMAIL,
      async signIn(email, password) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          return { error: null };
        } catch (e: any) {
          return { error: friendlyAuthError(e) };
        }
      },
      async signUp(email, password, fullName, accountType) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: fullName });
          await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), {
            email,
            full_name: fullName,
            role: 'user',
            account_type: accountType,
            created_at: serverTimestamp(),
          });
          notifyAllAdmins(
            'new_user_registered',
            'New user registered',
            `${fullName} (${email}) just created an account${accountType ? ` as a ${accountType}` : ''}.`
          ).catch(() => {});
          return { error: null };
        } catch (e: any) {
          return { error: friendlyAuthError(e) };
        }
      },
      async signOut() {
        await firebaseSignOut(auth);
      },
      async refreshProfile() {
        if (session) await loadProfile(session.uid, session.email);
      },
      async setAccountType(accountType) {
        if (!session) return;
        await setDoc(doc(db, USERS_COLLECTION, session.uid), { account_type: accountType }, { merge: true });
        await loadProfile(session.uid, session.email);
      },
      async resetPassword(email) {
        try {
          await sendPasswordResetEmail(auth, email);
          return { error: null };
        } catch (e: any) {
          return { error: friendlyAuthError(e) };
        }
      },
      async deleteAccount() {
        const user = auth.currentUser;
        if (!user) return { error: 'You need to be signed in.' };
        try {
          // Best-effort: remove the profile docs that identify this user.
          // Firestore rules let a user delete only their own docs, so these
          // run before the Auth user itself is gone (after which they'd be
          // denied). Conversation/message history is intentionally left in
          // place — see the Privacy Policy section on data retention.
          await Promise.all([
            deleteDoc(doc(db, USERS_COLLECTION, user.uid)).catch(() => {}),
            deleteDoc(doc(db, 'app_model_profiles', user.uid)).catch(() => {}),
            deleteDoc(doc(db, 'app_instructor_profiles', user.uid)).catch(() => {}),
          ]);
          await deleteUser(user);
          return { error: null };
        } catch (e: any) {
          if (e?.code === 'auth/requires-recent-login') {
            return { error: 'For your security, please sign out and sign in again before deleting your account.' };
          }
          return { error: friendlyAuthError(e) };
        }
      },
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function friendlyAuthError(e: any): string {
  const code = e?.code ?? '';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.';
  if (code.includes('operation-not-allowed'))
    return 'Email/password sign-in is not enabled for this project yet.';
  return e?.message ?? 'Something went wrong. Please try again.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

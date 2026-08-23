import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'manager' | 'cashier';
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Sign up with email and password
 */
export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

/**
 * Sign in as quick restaurant cashier / operator (Anonymous or Demo account)
 */
export async function loginQuickCashier(staffName: string = 'کاشێری سەرەکی'): Promise<User> {
  // If user is already signed in, just update their name
  if (auth.currentUser) {
    if (staffName && auth.currentUser.displayName !== staffName) {
      await updateProfile(auth.currentUser, { displayName: staffName });
    }
    return auth.currentUser;
  }

  try {
    const userCredential = await signInAnonymously(auth);
    if (staffName) {
      await updateProfile(userCredential.user, { displayName: staffName });
    }
    return userCredential.user;
  } catch (err: any) {
    // If anonymous auth is disabled on the project, fallback to local staff demo account
    const demoEmail = `cashier_${Date.now()}@grilledpos.local`;
    const demoPass = 'POS-Pass123456';
    try {
      const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
      await updateProfile(cred.user, { displayName: staffName });
      return cred.user;
    } catch (createErr) {
      throw err;
    }
  }
}

/**
 * Sign out user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 */
export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

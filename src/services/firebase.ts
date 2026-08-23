import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Build the client config safely
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || '',
  authDomain: firebaseConfigJson.authDomain || '',
  projectId: firebaseConfigJson.projectId || '',
  storageBucket: firebaseConfigJson.storageBucket || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '',
  appId: firebaseConfigJson.appId || '',
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified databaseId if present
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

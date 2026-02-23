/**
 * Firebase configuration and app initialisation.
 *
 * Replace the placeholder values below with the credentials from your Firebase
 * project console (Project Settings → General → Your apps → Firebase SDK snippet).
 *
 * Environment-specific values can be supplied via a `.env` file and a package
 * like `react-native-dotenv` — add the keys listed here to that file and import
 * them instead of the hardcoded strings.
 */
import {initializeApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY ?? 'REPLACE_WITH_API_KEY',
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ?? 'REPLACE_WITH_AUTH_DOMAIN',
  projectId: process.env.FIREBASE_PROJECT_ID ?? 'REPLACE_WITH_PROJECT_ID',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ?? 'REPLACE_WITH_STORAGE_BUCKET',
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID ??
    'REPLACE_WITH_MESSAGING_SENDER_ID',
  appId: process.env.FIREBASE_APP_ID ?? 'REPLACE_WITH_APP_ID',
};

/** Singleton Firebase app instance — prevents double-initialisation in dev hot-reload cycles. */
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];

/** Firebase Authentication instance */
export const firebaseAuth: Auth = getAuth(app);

/** Cloud Firestore instance */
export const firestore: Firestore = getFirestore(app);

export default app;

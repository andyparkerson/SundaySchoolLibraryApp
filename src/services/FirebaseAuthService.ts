/**
 * FirebaseAuthService — wraps Firebase Authentication for email/password login.
 *
 * Responsibilities:
 *  - Sign up new users with email and password.
 *  - Sign in existing users.
 *  - Sign out the current user.
 *  - Expose the currently authenticated Firebase user.
 *  - Store the app-level UserRole in Firestore after registration so that
 *    security rules and the rest of the app can rely on it.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import {doc, setDoc, getDoc} from 'firebase/firestore';
import {firebaseAuth, firestore} from '../config/firebase';
import {UserRole} from '../models/User';

/** Shape of the extra profile data stored in the `users` Firestore collection. */
export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Register a new user with email and password, then write a profile document
 * to the `users` Firestore collection so that role-based security rules apply.
 *
 * @param name  Display name for the new account.
 * @param email Valid email address.
 * @param password  Password (Firebase enforces a minimum of 6 characters).
 * @param role  Role to assign; defaults to GeneralUser.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = UserRole.GeneralUser,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  const {uid} = credential.user;

  await setDoc(doc(firestore, 'users', uid), {
    userId: uid,
    name,
    email,
    role,
  } satisfies UserProfile);

  return credential;
}

/**
 * Sign in an existing user with email and password.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

/**
 * Sign out the currently authenticated user.
 */
export async function logoutUser(): Promise<void> {
  return signOut(firebaseAuth);
}

/**
 * Fetch the stored UserProfile from Firestore for the given Firebase UID.
 * Returns `null` when no profile document exists yet.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/**
 * Subscribe to Firebase Auth state changes.
 *
 * @param callback  Called immediately with the current user, then again on every change.
 * @returns An unsubscribe function — call it to stop listening.
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

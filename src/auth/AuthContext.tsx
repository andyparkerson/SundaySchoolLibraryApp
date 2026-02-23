/**
 * AuthContext — React context that exposes the currently signed-in Firebase
 * user and their app-level UserProfile (including role) to the component tree.
 *
 * Usage:
 *   1. Wrap your root component with <AuthProvider>.
 *   2. Call `useAuth()` in any child component to access auth state.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {User as FirebaseUser} from 'firebase/auth';
import {subscribeToAuthState, getUserProfile, UserProfile} from '../services/FirebaseAuthService';

/** Shape of the value provided by AuthContext. */
interface AuthContextValue {
  /** The raw Firebase user object, or `null` when not authenticated. */
  firebaseUser: FirebaseUser | null;
  /** The app-level profile (name, email, role) fetched from Firestore. */
  userProfile: UserProfile | null;
  /** `true` while the initial auth state is being resolved. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
});

/** Provides authentication state to the component tree. */
export function AuthProvider({children}: {children: ReactNode}): React.JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async fbUser => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{firebaseUser, userProfile, loading}}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume the AuthContext value.
 * Must be used inside an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

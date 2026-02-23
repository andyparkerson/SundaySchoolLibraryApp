/**
 * Unit tests for FirebaseAuthService.
 * Firebase SDK modules are fully mocked so no real network calls are made.
 */
import {UserRole} from '../../models/User';

// ── Mocks must be defined before any imports that reference them ──────────────

jest.mock('../../config/firebase', () => ({
  firebaseAuth: {currentUser: null},
  firestore: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn(),
}));

// ── Import the module under test after mocks are set up ──────────────────────

import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  subscribeToAuthState,
} from '../FirebaseAuthService';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {setDoc, getDoc} from 'firebase/firestore';

// ── Test suite ────────────────────────────────────────────────────────────────

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('creates a user with email and password then writes a Firestore profile', async () => {
      const fakeCredential = {user: {uid: 'uid-123'}};
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(
        fakeCredential,
      );

      const result = await registerUser(
        'Alice',
        'alice@example.com',
        'password123',
        UserRole.Librarian,
      );

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'alice@example.com',
        'password123',
      );
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'uid-123',
          name: 'Alice',
          email: 'alice@example.com',
          role: UserRole.Librarian,
        }),
      );
      expect(result).toBe(fakeCredential);
    });

    it('defaults to GeneralUser role when no role is provided', async () => {
      const fakeCredential = {user: {uid: 'uid-456'}};
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(
        fakeCredential,
      );

      await registerUser('Bob', 'bob@example.com', 'pass456');

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({role: UserRole.GeneralUser}),
      );
    });
  });

  describe('loginUser', () => {
    it('calls signInWithEmailAndPassword with the correct arguments', async () => {
      const fakeCredential = {user: {uid: 'uid-789'}};
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(
        fakeCredential,
      );

      const result = await loginUser('carol@example.com', 'mypassword');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'carol@example.com',
        'mypassword',
      );
      expect(result).toBe(fakeCredential);
    });
  });

  describe('logoutUser', () => {
    it('calls signOut', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await logoutUser();

      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('returns a UserProfile when the document exists', async () => {
      const profileData = {
        userId: 'uid-123',
        name: 'Alice',
        email: 'alice@example.com',
        role: UserRole.Librarian,
      };
      (getDoc as jest.Mock).mockResolvedValue({exists: () => true, data: () => profileData});

      const profile = await getUserProfile('uid-123');

      expect(profile).toEqual(profileData);
    });

    it('returns null when no document exists', async () => {
      mockGetDoc.mockResolvedValue({exists: () => false});

      const profile = await getUserProfile('uid-unknown');

      expect(profile).toBeNull();
    });
  });

  describe('subscribeToAuthState', () => {
    it('registers an onAuthStateChanged listener and returns an unsubscribe function', () => {
      const mockUnsub = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsub);

      const callback = jest.fn();
      const unsub = subscribeToAuthState(callback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(
        expect.anything(),
        callback,
      );
      expect(unsub).toBe(mockUnsub);
    });
  });
});

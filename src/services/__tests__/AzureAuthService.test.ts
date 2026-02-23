/**
 * Unit tests for AzureAuthService.
 * The global `fetch` is mocked so no real HTTP calls are made.
 */

// Mock config so no environment variable is needed
jest.mock('../../config/azureApi', () => ({
  AZURE_API_BASE_URL: 'http://localhost:7071/api',
}));

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserProfile,
  isAuthenticated,
  getToken,
  setToken,
} from '../AzureAuthService';
import {UserRole} from '../../models/User';

function mockFetch(status: number, body: object) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValueOnce(body),
  } as unknown as Response);
}

describe('AzureAuthService', () => {
  beforeEach(() => {
    setToken(null); // clear any token from previous test
    jest.clearAllMocks();
  });

  // ── registerUser ──────────────────────────────────────────────────────────
  describe('registerUser', () => {
    it('stores the token on success and returns the profile', async () => {
      const payload = {
        token: 'tok-abc',
        userId: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: UserRole.Librarian,
      };
      mockFetch(201, payload);

      const result = await registerUser('Alice', 'alice@example.com', 'pw', UserRole.Librarian);

      expect(result).toEqual(payload);
      expect(getToken()).toBe('tok-abc');
      expect(isAuthenticated()).toBe(true);
    });

    it('defaults to GeneralUser role', async () => {
      mockFetch(201, {token: 't', userId: 'u2', name: 'Bob', email: 'b@b.com', role: UserRole.GeneralUser});

      await registerUser('Bob', 'b@b.com', 'pw');

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
      expect(body.role).toBe(UserRole.GeneralUser);
    });

    it('throws on a 409 conflict response', async () => {
      mockFetch(409, {error: 'Email address is already registered'});

      await expect(registerUser('X', 'x@x.com', 'pw')).rejects.toThrow(
        'Email address is already registered',
      );
    });
  });

  // ── loginUser ─────────────────────────────────────────────────────────────
  describe('loginUser', () => {
    it('stores the token on successful login', async () => {
      mockFetch(200, {token: 'tok-xyz', userId: 'u3', name: 'Carol', email: 'c@c.com', role: UserRole.Instructor});

      const result = await loginUser('c@c.com', 'pw');

      expect(result.token).toBe('tok-xyz');
      expect(getToken()).toBe('tok-xyz');
    });

    it('throws on invalid credentials', async () => {
      mockFetch(401, {error: 'Invalid credentials'});

      await expect(loginUser('wrong@wrong.com', 'bad')).rejects.toThrow('Invalid credentials');
      expect(getToken()).toBeNull();
    });
  });

  // ── logoutUser ────────────────────────────────────────────────────────────
  describe('logoutUser', () => {
    it('clears the stored token', () => {
      setToken('some-token');
      expect(isAuthenticated()).toBe(true);

      logoutUser();

      expect(getToken()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });

  // ── getCurrentUserProfile ─────────────────────────────────────────────────
  describe('getCurrentUserProfile', () => {
    it('returns null when no token is stored', async () => {
      const profile = await getCurrentUserProfile();
      expect(profile).toBeNull();
    });

    it('returns the profile on a 200 response', async () => {
      setToken('valid-token');
      const profileData = {userId: 'u1', name: 'Alice', email: 'a@a.com', role: UserRole.Librarian};
      mockFetch(200, profileData);

      const profile = await getCurrentUserProfile();

      expect(profile).toEqual(profileData);
    });

    it('clears the token and returns null on a 401', async () => {
      setToken('expired-token');
      mockFetch(401, {error: 'Invalid or expired token'});

      const profile = await getCurrentUserProfile();

      expect(profile).toBeNull();
      expect(getToken()).toBeNull();
    });
  });
});

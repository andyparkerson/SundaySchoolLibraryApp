/**
 * AzureAuthService — email/password authentication against the Azure Functions API.
 *
 * The API issues a JSON Web Token (JWT) on successful login or registration.
 * The token is stored in module-level memory for the lifetime of the app session.
 * For persistent login across restarts, persist the token with AsyncStorage and
 * restore it on launch via `setToken`.
 *
 * Endpoint contract (see api/src/functions/auth.ts):
 *   POST /api/auth/register  { name, email, password, role? }
 *   POST /api/auth/login     { email, password }
 *   GET  /api/auth/me        Authorization: Bearer <token>
 */
import {AZURE_API_BASE_URL} from '../config/azureApi';
import {UserRole} from '../models/User';

export interface AzureUserProfile {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Module-level token store — replace with AsyncStorage for cross-restart persistence. */
let _token: string | null = null;

/** Store a token (e.g. after restoring it from AsyncStorage on app launch). */
export function setToken(token: string | null): void {
  _token = token;
}

/** Returns the current JWT, or null when not signed in. */
export function getToken(): string | null {
  return _token;
}

/** Returns true when a token is present (does not validate expiry). */
export function isAuthenticated(): boolean {
  return _token !== null;
}

/**
 * Register a new user account and store the returned JWT.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = UserRole.GeneralUser,
): Promise<AuthResponse> {
  const response = await fetch(`${AZURE_API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, email, password, role}),
  });

  const data = (await response.json()) as AuthResponse & {error?: string};
  if (!response.ok) {
    throw new Error(data.error ?? `Registration failed (${response.status})`);
  }

  _token = data.token;
  return data;
}

/**
 * Sign in with email and password and store the returned JWT.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${AZURE_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password}),
  });

  const data = (await response.json()) as AuthResponse & {error?: string};
  if (!response.ok) {
    throw new Error(data.error ?? `Login failed (${response.status})`);
  }

  _token = data.token;
  return data;
}

/**
 * Clear the stored JWT, effectively signing the user out.
 */
export function logoutUser(): void {
  _token = null;
}

/**
 * Fetch the current user's profile from the API using the stored token.
 * Returns null when not authenticated.
 */
export async function getCurrentUserProfile(): Promise<AzureUserProfile | null> {
  if (!_token) {
    return null;
  }

  const response = await fetch(`${AZURE_API_BASE_URL}/auth/me`, {
    headers: {Authorization: `Bearer ${_token}`},
  });

  if (response.status === 401) {
    _token = null;
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch profile (${response.status})`);
  }

  return (await response.json()) as AzureUserProfile;
}

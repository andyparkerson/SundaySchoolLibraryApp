/**
 * JWT validation middleware for Azure Functions.
 *
 * Extracts the Bearer token from the Authorization header, verifies it using
 * the shared JWT_SECRET, and returns the decoded payload.
 *
 * Throws an error (which the calling function should convert to a 401 response)
 * when the token is missing or invalid.
 */
import jwt from 'jsonwebtoken';
import {HttpRequest} from '@azure/functions';
import {UserRole} from '../models/userRole';

export interface TokenPayload {
  sub: string;    // user_id
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? '';

/**
 * Parse and verify the Bearer token from an HTTP request.
 *
 * @throws {Error} when no token is present or the token is invalid/expired.
 */
export function verifyToken(request: HttpRequest): TokenPayload {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw new Error('Missing authorization token');
  }

  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Sign a new JWT for the given user data.
 */
export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Auth HTTP triggers
 *
 * POST /api/auth/register  — create a new account
 * POST /api/auth/login     — sign in with email + password, returns a JWT
 * GET  /api/auth/me        — return the caller's profile (requires Bearer token)
 */
import {app, HttpRequest, HttpResponseInit, InvocationContext} from '@azure/functions';
import bcrypt from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';
import sql from 'mssql';
import {getPool} from '../db/database';
import {signToken, verifyToken} from '../middleware/validateToken';
import {UserRole} from '../models/userRole';

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
async function register(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    const {name, email, password, role = UserRole.GeneralUser} = body;

    if (!name || !email || !password) {
      return {status: 400, jsonBody: {error: 'name, email, and password are required'}};
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      return {status: 400, jsonBody: {error: `role must be one of: ${Object.values(UserRole).join(', ')}`}};
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const pool = await getPool();

    await pool
      .request()
      .input('userId', sql.NVarChar(128), userId)
      .input('name', sql.NVarChar(256), name)
      .input('email', sql.NVarChar(320), email)
      .input('passwordHash', sql.NVarChar(256), passwordHash)
      .input('role', sql.NVarChar(32), role)
      .query(
        `INSERT INTO users (user_id, name, email, password_hash, role)
         VALUES (@userId, @name, @email, @passwordHash, @role)`,
      );

    const token = signToken({sub: userId, email, name, role: role as UserRole});
    return {status: 201, jsonBody: {token, userId, name, email, role}};
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'number' in err &&
      (err as {number: unknown}).number === 2627
    ) {
      return {status: 409, jsonBody: {error: 'Email address is already registered'}};
    }
    return {status: 500, jsonBody: {error: 'Internal server error'}};
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
async function login(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as {email?: string; password?: string};
    const {email, password} = body;

    if (!email || !password) {
      return {status: 400, jsonBody: {error: 'email and password are required'}};
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar(320), email)
      .query(
        `SELECT user_id, name, email, password_hash, role
         FROM users WHERE email = @email`,
      );

    if (result.recordset.length === 0) {
      return {status: 401, jsonBody: {error: 'Invalid credentials'}};
    }

    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return {status: 401, jsonBody: {error: 'Invalid credentials'}};
    }

    const token = signToken({
      sub: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    return {
      status: 200,
      jsonBody: {token, userId: user.user_id, name: user.name, email: user.email, role: user.role},
    };
  } catch {
    return {status: 500, jsonBody: {error: 'Internal server error'}};
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
async function me(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const payload = verifyToken(request);
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.NVarChar(128), payload.sub)
      .query(
        `SELECT user_id, name, email, role FROM users WHERE user_id = @userId`,
      );

    if (result.recordset.length === 0) {
      return {status: 404, jsonBody: {error: 'User not found'}};
    }

    const user = result.recordset[0];
    return {
      status: 200,
      jsonBody: {userId: user.user_id, name: user.name, email: user.email, role: user.role},
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Missing authorization token') {
      return {status: 401, jsonBody: {error: err.message}};
    }
    return {status: 401, jsonBody: {error: 'Invalid or expired token'}};
  }
}

// ---------------------------------------------------------------------------
// Register routes
// ---------------------------------------------------------------------------
app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register,
});

app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});

app.http('auth-me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: me,
});

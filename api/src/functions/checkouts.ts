/**
 * Checkouts HTTP triggers
 *
 * GET  /api/checkouts              — list checkouts (Librarian: all; others: own)
 * POST /api/checkouts              — create a checkout record (authenticated users)
 * PUT  /api/checkouts/{id}/return  — mark a checkout as returned
 */
import {app, HttpRequest, HttpResponseInit, InvocationContext} from '@azure/functions';
import {v4 as uuidv4} from 'uuid';
import sql from 'mssql';
import {getPool} from '../db/database';
import {verifyToken} from '../middleware/validateToken';
import {UserRole} from '../models/userRole';

// ---------------------------------------------------------------------------
// GET /api/checkouts
// ---------------------------------------------------------------------------
async function listCheckouts(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const payload = verifyToken(request);
    const pool = await getPool();

    let result: sql.IResult<Record<string, unknown>>;

    if (payload.role === UserRole.Librarian || payload.role === UserRole.Instructor) {
      // Librarians and Instructors can see all checkouts
      result = await pool.request().query(
        `SELECT checkout_id, book_id, user_id, quantity, date_out, date_in, notes
         FROM checkouts ORDER BY date_out DESC`,
      );
    } else {
      // General users see only their own records
      result = await pool
        .request()
        .input('userId', sql.NVarChar(128), payload.sub)
        .query(
          `SELECT checkout_id, book_id, user_id, quantity, date_out, date_in, notes
           FROM checkouts WHERE user_id = @userId ORDER BY date_out DESC`,
        );
    }

    const checkouts = result.recordset.map(row => ({
      id: row.checkout_id,
      bookId: row.book_id,
      userId: row.user_id,
      quantity: row.quantity,
      dateOut: row.date_out,
      dateIn: row.date_in ?? undefined,
      notes: row.notes ?? undefined,
    }));

    return {status: 200, jsonBody: checkouts};
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/checkouts
// ---------------------------------------------------------------------------
async function createCheckout(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const payload = verifyToken(request);
    const body = (await request.json()) as {
      bookId?: string;
      quantity?: number;
      notes?: string;
    };

    const {bookId, quantity = 1, notes} = body;
    if (!bookId) {
      return {status: 400, jsonBody: {error: 'bookId is required'}};
    }

    const checkoutId = uuidv4();
    const pool = await getPool();

    // Verify the book exists and has enough copies
    const bookResult = await pool
      .request()
      .input('isbn', sql.NVarChar(20), bookId)
      .query(`SELECT available_copies FROM books WHERE isbn = @isbn`);

    if (bookResult.recordset.length === 0) {
      return {status: 404, jsonBody: {error: 'Book not found'}};
    }
    if (bookResult.recordset[0].available_copies < quantity) {
      return {status: 409, jsonBody: {error: 'Not enough copies available'}};
    }

    // Insert checkout and decrement available_copies atomically
    await pool
      .request()
      .input('checkoutId', sql.NVarChar(36), checkoutId)
      .input('bookId', sql.NVarChar(20), bookId)
      .input('userId', sql.NVarChar(128), payload.sub)
      .input('quantity', sql.Int, quantity)
      .input('notes', sql.NVarChar(1024), notes ?? null)
      .query(
        `BEGIN TRANSACTION;
         INSERT INTO checkouts (checkout_id, book_id, user_id, quantity, notes)
           VALUES (@checkoutId, @bookId, @userId, @quantity, @notes);
         UPDATE books
           SET available_copies = available_copies - @quantity,
               updated_at       = SYSUTCDATETIME()
           WHERE isbn = @bookId;
         COMMIT;`,
      );

    return {
      status: 201,
      jsonBody: {id: checkoutId, bookId, userId: payload.sub, quantity, notes},
    };
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/checkouts/{id}/return
// ---------------------------------------------------------------------------
async function returnCheckout(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const payload = verifyToken(request);
    const checkoutId = request.params.id;
    const pool = await getPool();

    // Fetch the checkout to verify ownership or Librarian role
    const existing = await pool
      .request()
      .input('checkoutId', sql.NVarChar(36), checkoutId)
      .query(
        `SELECT book_id, user_id, quantity, date_in FROM checkouts WHERE checkout_id = @checkoutId`,
      );

    if (existing.recordset.length === 0) {
      return {status: 404, jsonBody: {error: 'Checkout not found'}};
    }

    const record = existing.recordset[0];

    if (payload.role !== UserRole.Librarian && record.user_id !== payload.sub) {
      return {status: 403, jsonBody: {error: 'Forbidden: you can only return your own checkouts'}};
    }

    if (record.date_in !== null) {
      return {status: 409, jsonBody: {error: 'This checkout has already been returned'}};
    }

    await pool
      .request()
      .input('checkoutId', sql.NVarChar(36), checkoutId)
      .input('bookId', sql.NVarChar(20), record.book_id as string)
      .input('quantity', sql.Int, record.quantity as number)
      .query(
        `BEGIN TRANSACTION;
         UPDATE checkouts SET date_in = SYSUTCDATETIME() WHERE checkout_id = @checkoutId;
         UPDATE books
           SET available_copies = available_copies + @quantity,
               updated_at       = SYSUTCDATETIME()
           WHERE isbn = @bookId;
         COMMIT;`,
      );

    return {status: 200, jsonBody: {message: 'Book returned successfully'}};
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// Error helper (shared with books.ts pattern)
// ---------------------------------------------------------------------------
function authOrServerError(err: unknown): HttpResponseInit {
  if (err instanceof Error) {
    if (err.message === 'Missing authorization token') {
      return {status: 401, jsonBody: {error: err.message}};
    }
    if (
      err.message.includes('Invalid') ||
      err.message.includes('expired') ||
      err.message.includes('jwt')
    ) {
      return {status: 401, jsonBody: {error: 'Invalid or expired token'}};
    }
  }
  return {status: 500, jsonBody: {error: 'Internal server error'}};
}

// ---------------------------------------------------------------------------
// Register routes
// ---------------------------------------------------------------------------
app.http('checkouts-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'checkouts',
  handler: listCheckouts,
});

app.http('checkouts-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'checkouts',
  handler: createCheckout,
});

app.http('checkouts-return', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'checkouts/{id}/return',
  handler: returnCheckout,
});

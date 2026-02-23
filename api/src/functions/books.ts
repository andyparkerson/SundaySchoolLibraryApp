/**
 * Books HTTP triggers
 *
 * GET    /api/books         — list all books (authenticated users)
 * GET    /api/books/{isbn}  — get one book (authenticated users)
 * POST   /api/books         — add a book (Librarian only)
 * PUT    /api/books/{isbn}  — update a book (Librarian only)
 * DELETE /api/books/{isbn}  — delete a book (Librarian only)
 */
import {app, HttpRequest, HttpResponseInit, InvocationContext} from '@azure/functions';
import sql from 'mssql';
import {getPool} from '../db/database';
import {verifyToken} from '../middleware/validateToken';
import {UserRole} from '../models/userRole';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requireAuth(request: HttpRequest) {
  return verifyToken(request);
}

function requireLibrarian(request: HttpRequest) {
  const payload = verifyToken(request);
  if (payload.role !== UserRole.Librarian) {
    throw Object.assign(new Error('Forbidden'), {status: 403});
  }
  return payload;
}

// ---------------------------------------------------------------------------
// GET /api/books
// ---------------------------------------------------------------------------
async function listBooks(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    requireAuth(request);
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT isbn, title, authors, edition, synopsis, tags, total_copies, available_copies
       FROM books ORDER BY title`,
    );
    const books = result.recordset.map(row => ({
      isbn: row.isbn,
      title: row.title,
      authors: JSON.parse(row.authors) as string[],
      edition: row.edition ?? undefined,
      synopsis: row.synopsis ?? undefined,
      tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
      totalCopies: row.total_copies,
      availableCopies: row.available_copies,
    }));
    return {status: 200, jsonBody: books};
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/books/{isbn}
// ---------------------------------------------------------------------------
async function getBook(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    requireAuth(request);
    const isbn = request.params.isbn;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('isbn', sql.NVarChar(20), isbn)
      .query(
        `SELECT isbn, title, authors, edition, synopsis, tags, total_copies, available_copies
         FROM books WHERE isbn = @isbn`,
      );
    if (result.recordset.length === 0) {
      return {status: 404, jsonBody: {error: 'Book not found'}};
    }
    const row = result.recordset[0];
    return {
      status: 200,
      jsonBody: {
        isbn: row.isbn,
        title: row.title,
        authors: JSON.parse(row.authors) as string[],
        edition: row.edition ?? undefined,
        synopsis: row.synopsis ?? undefined,
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
        totalCopies: row.total_copies,
        availableCopies: row.available_copies,
      },
    };
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/books
// ---------------------------------------------------------------------------
async function createBook(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    requireLibrarian(request);
    const body = (await request.json()) as {
      isbn?: string;
      title?: string;
      authors?: string[];
      edition?: string;
      synopsis?: string;
      tags?: string[];
      totalCopies?: number;
      availableCopies?: number;
    };

    const {isbn, title, authors, edition, synopsis, tags, totalCopies = 0, availableCopies = 0} = body;
    if (!isbn || !title || !authors?.length) {
      return {status: 400, jsonBody: {error: 'isbn, title, and authors are required'}};
    }

    const pool = await getPool();
    await pool
      .request()
      .input('isbn', sql.NVarChar(20), isbn)
      .input('title', sql.NVarChar(512), title)
      .input('authors', sql.NVarChar(sql.MAX), JSON.stringify(authors))
      .input('edition', sql.NVarChar(64), edition ?? null)
      .input('synopsis', sql.NVarChar(sql.MAX), synopsis ?? null)
      .input('tags', sql.NVarChar(sql.MAX), tags ? JSON.stringify(tags) : null)
      .input('totalCopies', sql.Int, totalCopies)
      .input('availableCopies', sql.Int, availableCopies)
      .query(
        `INSERT INTO books (isbn, title, authors, edition, synopsis, tags, total_copies, available_copies)
         VALUES (@isbn, @title, @authors, @edition, @synopsis, @tags, @totalCopies, @availableCopies)`,
      );

    return {status: 201, jsonBody: {isbn, title, authors, edition, synopsis, tags, totalCopies, availableCopies}};
  } catch (err: unknown) {
    if (isSqlDuplicateKey(err)) {
      return {status: 409, jsonBody: {error: 'A book with this ISBN already exists'}};
    }
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/books/{isbn}
// ---------------------------------------------------------------------------
async function updateBook(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    requireLibrarian(request);
    const isbn = request.params.isbn;
    const body = (await request.json()) as {
      title?: string;
      authors?: string[];
      edition?: string;
      synopsis?: string;
      tags?: string[];
      totalCopies?: number;
      availableCopies?: number;
    };

    const pool = await getPool();
    const result = await pool
      .request()
      .input('isbn', sql.NVarChar(20), isbn)
      .input('title', sql.NVarChar(512), body.title ?? null)
      .input('authors', sql.NVarChar(sql.MAX), body.authors ? JSON.stringify(body.authors) : null)
      .input('edition', sql.NVarChar(64), body.edition ?? null)
      .input('synopsis', sql.NVarChar(sql.MAX), body.synopsis ?? null)
      .input('tags', sql.NVarChar(sql.MAX), body.tags ? JSON.stringify(body.tags) : null)
      .input('totalCopies', sql.Int, body.totalCopies ?? null)
      .input('availableCopies', sql.Int, body.availableCopies ?? null)
      .query(
        `UPDATE books SET
           title            = COALESCE(@title, title),
           authors          = COALESCE(@authors, authors),
           edition          = COALESCE(@edition, edition),
           synopsis         = COALESCE(@synopsis, synopsis),
           tags             = COALESCE(@tags, tags),
           total_copies     = COALESCE(@totalCopies, total_copies),
           available_copies = COALESCE(@availableCopies, available_copies),
           updated_at       = SYSUTCDATETIME()
         WHERE isbn = @isbn`,
      );

    if (result.rowsAffected[0] === 0) {
      return {status: 404, jsonBody: {error: 'Book not found'}};
    }
    return {status: 200, jsonBody: {message: 'Book updated'}};
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/books/{isbn}
// ---------------------------------------------------------------------------
async function deleteBook(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    requireLibrarian(request);
    const isbn = request.params.isbn;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('isbn', sql.NVarChar(20), isbn)
      .query(`DELETE FROM books WHERE isbn = @isbn`);

    if (result.rowsAffected[0] === 0) {
      return {status: 404, jsonBody: {error: 'Book not found'}};
    }
    return {status: 204};
  } catch (err: unknown) {
    return authOrServerError(err);
  }
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------
function isSqlDuplicateKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'number' in err &&
    (err as {number: number}).number === 2627
  );
}

function authOrServerError(err: unknown): HttpResponseInit {
  if (err instanceof Error) {
    if (err.message === 'Missing authorization token') {
      return {status: 401, jsonBody: {error: err.message}};
    }
    if ((err as {status?: number}).status === 403) {
      return {status: 403, jsonBody: {error: 'Forbidden: Librarian role required'}};
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
app.http('books-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'books',
  handler: listBooks,
});

app.http('books-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'books/{isbn}',
  handler: getBook,
});

app.http('books-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'books',
  handler: createBook,
});

app.http('books-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'books/{isbn}',
  handler: updateBook,
});

app.http('books-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'books/{isbn}',
  handler: deleteBook,
});

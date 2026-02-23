/**
 * AzureBookService — REST client for the Azure Functions books API.
 *
 * All writes require a Librarian JWT (enforced server-side).
 * Reads require any authenticated user JWT.
 *
 * Near-real-time updates are achieved via polling: `subscribeToBooks` calls
 * the list endpoint on a configurable interval and notifies the caller
 * whenever the data changes.
 *
 * Endpoint contract (see api/src/functions/books.ts):
 *   GET    /api/books         — list all books
 *   GET    /api/books/{isbn}  — get one book
 *   POST   /api/books         — create (Librarian)
 *   PUT    /api/books/{isbn}  — update (Librarian)
 *   DELETE /api/books/{isbn}  — delete (Librarian)
 */
import {AZURE_API_BASE_URL} from '../config/azureApi';
import {getToken} from './AzureAuthService';
import {Book} from '../models/Book';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & {error?: string};
  if (!response.ok) {
    throw new Error(
      (data as {error?: string}).error ?? `Request failed (${response.status})`,
    );
  }
  return data;
}

/**
 * Fetch all books from the API.
 */
export async function getAllBooks(): Promise<Book[]> {
  const response = await fetch(`${AZURE_API_BASE_URL}/books`, {
    headers: authHeaders(),
  });
  return handleResponse<Book[]>(response);
}

/**
 * Fetch a single book by ISBN. Returns `undefined` when not found.
 */
export async function getBookByIsbn(isbn: string): Promise<Book | undefined> {
  const response = await fetch(`${AZURE_API_BASE_URL}/books/${encodeURIComponent(isbn)}`, {
    headers: authHeaders(),
  });
  if (response.status === 404) {
    return undefined;
  }
  return handleResponse<Book>(response);
}

/**
 * Add a new book (Librarian only).
 */
export async function addBook(book: Book): Promise<void> {
  const response = await fetch(`${AZURE_API_BASE_URL}/books`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(book),
  });
  await handleResponse<Book>(response);
}

/**
 * Update an existing book (Librarian only).
 */
export async function updateBook(book: Book): Promise<void> {
  const response = await fetch(
    `${AZURE_API_BASE_URL}/books/${encodeURIComponent(book.isbn)}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(book),
    },
  );
  await handleResponse<{message: string}>(response);
}

/**
 * Delete a book by ISBN (Librarian only).
 */
export async function removeBook(isbn: string): Promise<void> {
  const response = await fetch(
    `${AZURE_API_BASE_URL}/books/${encodeURIComponent(isbn)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );
  if (response.status !== 204) {
    await handleResponse<void>(response);
  }
}

/**
 * Poll the books API at a fixed interval and notify the caller whenever
 * the data changes (by comparing JSON stringification).
 *
 * This provides near-real-time updates without requiring a persistent WebSocket
 * or SignalR connection.
 *
 * @param onUpdate     Called with the latest book list whenever it changes.
 * @param onError      Optional error handler called on fetch failures.
 * @param intervalMs   Polling interval in milliseconds (default: 10 000).
 * @returns A stop function — call it to cancel polling.
 */
export function subscribeToBooks(
  onUpdate: (books: Book[]) => void,
  onError?: (err: Error) => void,
  intervalMs = 10_000,
): () => void {
  let lastJson = '';
  let timer: ReturnType<typeof setInterval> | null = null;

  async function poll() {
    try {
      const books = await getAllBooks();
      const json = JSON.stringify(books);
      if (json !== lastJson) {
        lastJson = json;
        onUpdate(books);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Fire immediately, then on each interval
  void poll();
  timer = setInterval(() => void poll(), intervalMs);

  return () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

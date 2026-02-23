/**
 * Unit tests for AzureBookService.
 * The global `fetch` is mocked so no real HTTP calls are made.
 */

jest.mock('../../config/azureApi', () => ({
  AZURE_API_BASE_URL: 'http://localhost:7071/api',
}));

jest.mock('../AzureAuthService', () => ({
  getToken: jest.fn(() => 'test-token'),
}));

import {
  getAllBooks,
  getBookByIsbn,
  addBook,
  updateBook,
  removeBook,
  subscribeToBooks,
} from '../AzureBookService';
import {Book} from '../../models/Book';

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValueOnce(body),
  } as unknown as Response);
}

const sampleBook: Book = {
  isbn: '9780781444996',
  title: 'The Action Bible',
  authors: ['Doug Mauss'],
  totalCopies: 3,
  availableCopies: 2,
};

describe('AzureBookService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAllBooks ────────────────────────────────────────────────────────────
  describe('getAllBooks', () => {
    it('returns a parsed book array on success', async () => {
      mockFetch(200, [sampleBook]);

      const books = await getAllBooks();

      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('The Action Bible');
    });

    it('throws on an error response', async () => {
      mockFetch(401, {error: 'Missing authorization token'});

      await expect(getAllBooks()).rejects.toThrow('Missing authorization token');
    });
  });

  // ── getBookByIsbn ──────────────────────────────────────────────────────────
  describe('getBookByIsbn', () => {
    it('returns the book when found', async () => {
      mockFetch(200, sampleBook);

      const book = await getBookByIsbn('9780781444996');

      expect(book).toEqual(sampleBook);
    });

    it('returns undefined on a 404', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValueOnce({error: 'Book not found'}),
      } as unknown as Response);

      const book = await getBookByIsbn('0000000000');

      expect(book).toBeUndefined();
    });
  });

  // ── addBook ────────────────────────────────────────────────────────────────
  describe('addBook', () => {
    it('sends a POST request with the book data', async () => {
      mockFetch(201, sampleBook);

      await addBook(sampleBook);

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(JSON.parse(call[1].body as string)).toMatchObject({isbn: '9780781444996'});
    });

    it('throws on a 409 duplicate', async () => {
      mockFetch(409, {error: 'A book with this ISBN already exists'});

      await expect(addBook(sampleBook)).rejects.toThrow('A book with this ISBN already exists');
    });
  });

  // ── updateBook ─────────────────────────────────────────────────────────────
  describe('updateBook', () => {
    it('sends a PUT request to the correct URL', async () => {
      mockFetch(200, {message: 'Book updated'});

      await updateBook({...sampleBook, availableCopies: 1});

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('PUT');
      expect(call[0]).toContain('9780781444996');
    });
  });

  // ── removeBook ─────────────────────────────────────────────────────────────
  describe('removeBook', () => {
    it('sends a DELETE request to the correct URL', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: jest.fn(),
      } as unknown as Response);

      await removeBook('9780781444996');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('DELETE');
      expect(call[0]).toContain('9780781444996');
    });
  });

  // ── subscribeToBooks ───────────────────────────────────────────────────────
  describe('subscribeToBooks', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('fires onUpdate immediately with the fetched books', async () => {
      mockFetch(200, [sampleBook]);
      const onUpdate = jest.fn();

      subscribeToBooks(onUpdate, undefined, 5000);

      // poll() does: await fetch → await response.json() → logic; flush each step
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onUpdate).toHaveBeenCalledWith([sampleBook]);
    });

    it('returns a stop function that clears the interval', () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      } as unknown as Response);

      const stop = subscribeToBooks(jest.fn(), undefined, 5000);
      stop();

      jest.advanceTimersByTime(20_000);

      // fetch called once for the immediate poll (before stop), not again after
      expect((global.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('calls onError when the fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
      const onError = jest.fn();

      subscribeToBooks(jest.fn(), onError, 5000);

      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

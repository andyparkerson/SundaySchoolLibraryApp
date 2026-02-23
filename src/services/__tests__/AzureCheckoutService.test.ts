/**
 * Unit tests for AzureCheckoutService.
 * The global `fetch` is mocked so no real HTTP calls are made.
 */

jest.mock('../../config/azureApi', () => ({
  AZURE_API_BASE_URL: 'http://localhost:7071/api',
}));

jest.mock('../AzureAuthService', () => ({
  getToken: jest.fn(() => 'test-token'),
}));

import {
  getAllCheckouts,
  checkOutBook,
  returnBook,
  subscribeToCheckouts,
} from '../AzureCheckoutService';

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValueOnce(body),
  } as unknown as Response);
}

const isoNow = new Date('2024-01-15T10:00:00.000Z').toISOString();
const isoReturn = new Date('2024-01-20T12:00:00.000Z').toISOString();

const apiCheckout = {
  id: 'co-001',
  bookId: '9780781444996',
  userId: 'user-001',
  quantity: 1,
  dateOut: isoNow,
  dateIn: null,
  notes: null,
};

describe('AzureCheckoutService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAllCheckouts ────────────────────────────────────────────────────────
  describe('getAllCheckouts', () => {
    it('converts ISO date strings to Date objects', async () => {
      mockFetch(200, [apiCheckout]);

      const checkouts = await getAllCheckouts();

      expect(checkouts).toHaveLength(1);
      expect(checkouts[0].dateOut).toBeInstanceOf(Date);
      expect(checkouts[0].dateIn).toBeUndefined();
    });

    it('correctly maps dateIn when present', async () => {
      mockFetch(200, [{...apiCheckout, dateIn: isoReturn}]);

      const checkouts = await getAllCheckouts();

      expect(checkouts[0].dateIn).toBeInstanceOf(Date);
      expect(checkouts[0].dateIn?.toISOString()).toBe(isoReturn);
    });

    it('throws on an error response', async () => {
      mockFetch(401, {error: 'Missing authorization token'});

      await expect(getAllCheckouts()).rejects.toThrow('Missing authorization token');
    });
  });

  // ── checkOutBook ───────────────────────────────────────────────────────────
  describe('checkOutBook', () => {
    it('returns the new checkout ID on success', async () => {
      mockFetch(201, {id: 'co-new', bookId: '9780781444996', userId: 'user-001', quantity: 1});

      const id = await checkOutBook('9780781444996', 1, 'For class');

      expect(id).toBe('co-new');
    });

    it('sends quantity and notes in the request body', async () => {
      mockFetch(201, {id: 'co-new2', bookId: '978', userId: 'u', quantity: 2});

      await checkOutBook('978', 2, 'notes here');

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
      expect(body).toMatchObject({bookId: '978', quantity: 2, notes: 'notes here'});
    });

    it('throws when not enough copies are available', async () => {
      mockFetch(409, {error: 'Not enough copies available'});

      await expect(checkOutBook('978', 5)).rejects.toThrow('Not enough copies available');
    });
  });

  // ── returnBook ─────────────────────────────────────────────────────────────
  describe('returnBook', () => {
    it('sends a PUT request to the correct URL', async () => {
      mockFetch(200, {message: 'Book returned successfully'});

      await returnBook('co-001');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('PUT');
      expect(call[0]).toContain('co-001/return');
    });

    it('throws when the checkout was already returned', async () => {
      mockFetch(409, {error: 'This checkout has already been returned'});

      await expect(returnBook('co-001')).rejects.toThrow(
        'This checkout has already been returned',
      );
    });
  });

  // ── subscribeToCheckouts ───────────────────────────────────────────────────
  describe('subscribeToCheckouts', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('fires onUpdate immediately with current checkouts', async () => {
      mockFetch(200, [apiCheckout]);
      const onUpdate = jest.fn();

      subscribeToCheckouts(onUpdate, undefined, 5000);

      // poll() does: await fetch → await response.json() → mapping; flush each step
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0][0].bookId).toBe('9780781444996');
    });

    it('returns a stop function that cancels polling', () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      } as unknown as Response);

      const stop = subscribeToCheckouts(jest.fn(), undefined, 5000);
      stop();

      jest.advanceTimersByTime(30_000);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(1);
    });
  });
});

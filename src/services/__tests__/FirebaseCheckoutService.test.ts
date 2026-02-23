/**
 * Unit tests for FirebaseCheckoutService.
 * Firebase SDK modules are fully mocked so no real network calls are made.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockOnSnapshot = jest.fn();

/** Simulate Firestore Timestamp with a toDate() method. */
const makeTimestamp = (date: Date) => ({toDate: () => date});

jest.mock('../../config/firebase', () => ({
  firestore: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  onSnapshot: mockOnSnapshot,
  query: jest.fn(col => col),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  Timestamp: {
    fromDate: (d: Date) => makeTimestamp(d),
  },
}));

// ── Import under test ─────────────────────────────────────────────────────────

import {
  getAllCheckouts,
  checkOutBook,
  returnBook,
  subscribeToUserCheckouts,
} from '../FirebaseCheckoutService';
import {Checkout} from '../../models/CheckoutRecord';

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = new Date('2024-01-15T10:00:00Z');

const sampleCheckout: Checkout = {
  bookId: '9780781444996',
  userId: 'user-001',
  quantity: 1,
  dateOut: now,
};

function makeSnapshot(checkouts: Array<{id: string; data: object}>) {
  return {
    empty: checkouts.length === 0,
    docs: checkouts.map(c => ({id: c.id, data: () => c.data})),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FirebaseCheckoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCheckouts', () => {
    it('returns all checkout records from Firestore', async () => {
      mockGetDocs.mockResolvedValue(
        makeSnapshot([
          {
            id: 'co-001',
            data: {
              bookId: sampleCheckout.bookId,
              userId: sampleCheckout.userId,
              quantity: sampleCheckout.quantity,
              dateOut: makeTimestamp(now),
              dateIn: null,
              notes: null,
            },
          },
        ]),
      );

      const records = await getAllCheckouts();

      expect(records).toHaveLength(1);
      expect(records[0].bookId).toBe('9780781444996');
      expect(records[0].dateIn).toBeUndefined();
    });

    it('returns an empty array when no records exist', async () => {
      mockGetDocs.mockResolvedValue(makeSnapshot([]));

      const records = await getAllCheckouts();

      expect(records).toEqual([]);
    });
  });

  describe('checkOutBook', () => {
    it('calls addDoc with the correct checkout data and returns the new doc ID', async () => {
      mockAddDoc.mockResolvedValue({id: 'co-new-001'});

      const id = await checkOutBook(sampleCheckout);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bookId: sampleCheckout.bookId,
          userId: sampleCheckout.userId,
          quantity: sampleCheckout.quantity,
          dateIn: null,
        }),
      );
      expect(id).toBe('co-new-001');
    });
  });

  describe('returnBook', () => {
    it('calls updateDoc with a dateIn timestamp', async () => {
      const returnDate = new Date('2024-01-20T12:00:00Z');

      await returnBook('co-001', returnDate);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dateIn: expect.objectContaining({toDate: expect.any(Function)}),
        }),
      );
    });

    it('uses the current date when returnDate is omitted', async () => {
      await returnBook('co-001');

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('subscribeToUserCheckouts', () => {
    it('registers a listener and returns an unsubscribe function', () => {
      const mockUnsub = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const onUpdate = jest.fn();
      const unsub = subscribeToUserCheckouts('user-001', onUpdate);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsub).toBe(mockUnsub);
    });

    it('calls onUpdate with parsed checkouts when the snapshot fires', () => {
      mockOnSnapshot.mockImplementation((_q, callback) => {
        callback(
          makeSnapshot([
            {
              id: 'co-001',
              data: {
                bookId: sampleCheckout.bookId,
                userId: sampleCheckout.userId,
                quantity: 1,
                dateOut: makeTimestamp(now),
                dateIn: null,
                notes: null,
              },
            },
          ]),
        );
        return jest.fn();
      });

      const onUpdate = jest.fn();
      subscribeToUserCheckouts('user-001', onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({bookId: '9780781444996'}),
        ]),
      );
    });
  });
});

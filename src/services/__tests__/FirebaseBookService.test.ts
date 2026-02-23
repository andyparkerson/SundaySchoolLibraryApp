/**
 * Unit tests for FirebaseBookService.
 * Firebase SDK modules are fully mocked so no real network calls are made.
 */

// ── Mocks — implementations must be defined inside the factory ───────────────

jest.mock('../../config/firebase', () => ({
  firestore: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn(),
  query: jest.fn(col => col),
  orderBy: jest.fn(() => ({})),
}));

// ── Import under test and mocked modules ─────────────────────────────────────

import {
  getAllBooks,
  getBookByIsbn,
  addBook,
  updateBook,
  removeBook,
  subscribeToBooks,
} from '../FirebaseBookService';
import {Book} from '../../models/Book';
import {getDocs, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot} from 'firebase/firestore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sampleBook: Book = {
  isbn: '9780781444996',
  title: 'The Action Bible',
  authors: ['Doug Mauss'],
  totalCopies: 3,
  availableCopies: 2,
};

function makeSnapshot(books: Book[]) {
  return {
    docs: books.map(b => ({data: () => b})),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FirebaseBookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBooks', () => {
    it('returns all books from Firestore', async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeSnapshot([sampleBook]));

      const books = await getAllBooks();

      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('The Action Bible');
    });

    it('returns an empty array when the collection is empty', async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeSnapshot([]));

      const books = await getAllBooks();

      expect(books).toEqual([]);
    });
  });

  describe('getBookByIsbn', () => {
    it('returns the book when the document exists', async () => {
      (getDoc as jest.Mock).mockResolvedValue({exists: () => true, data: () => sampleBook});

      const book = await getBookByIsbn('9780781444996');

      expect(book).toEqual(sampleBook);
    });

    it('returns undefined when the document does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({exists: () => false});

      const book = await getBookByIsbn('0000000000000');

      expect(book).toBeUndefined();
    });
  });

  describe('addBook', () => {
    it('calls setDoc with the book data', async () => {
      await addBook(sampleBook);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        sampleBook,
      );
    });
  });

  describe('updateBook', () => {
    it('calls updateDoc with the updated book fields', async () => {
      const updated: Book = {...sampleBook, availableCopies: 1};

      await updateBook(updated);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({availableCopies: 1}),
      );
    });
  });

  describe('removeBook', () => {
    it('calls deleteDoc for the given ISBN', async () => {
      await removeBook('9780781444996');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('subscribeToBooks', () => {
    it('registers a Firestore onSnapshot listener and returns an unsubscribe function', () => {
      const mockUnsub = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsub);

      const onUpdate = jest.fn();
      const unsub = subscribeToBooks(onUpdate);

      expect(onSnapshot).toHaveBeenCalled();
      expect(unsub).toBe(mockUnsub);
    });

    it('calls onUpdate with parsed books when the snapshot fires', () => {
      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        callback(makeSnapshot([sampleBook]));
        return jest.fn();
      });

      const onUpdate = jest.fn();
      subscribeToBooks(onUpdate);

      expect(onUpdate).toHaveBeenCalledWith([sampleBook]);
    });
  });
});


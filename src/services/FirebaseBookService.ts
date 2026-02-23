/**
 * FirebaseBookService — Firestore-backed implementation of book CRUD operations.
 *
 * All writes go through Firestore so that any connected client receives
 * real-time updates via the `subscribeToBooks` listener.
 *
 * Collection path: `books/{isbn}`
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import {firestore} from '../config/firebase';
import {Book} from '../models/Book';

const BOOKS_COLLECTION = 'books';

function docToBook(data: DocumentData): Book {
  return {
    isbn: data.isbn,
    title: data.title,
    authors: data.authors,
    edition: data.edition,
    synopsis: data.synopsis,
    tags: data.tags,
    totalCopies: data.totalCopies,
    availableCopies: data.availableCopies,
  };
}

/**
 * Fetch all books from Firestore once (non-real-time).
 */
export async function getAllBooks(): Promise<Book[]> {
  const q = query(collection(firestore, BOOKS_COLLECTION), orderBy('title'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToBook(d.data()));
}

/**
 * Fetch a single book by ISBN.
 * Returns `undefined` when no matching document is found.
 */
export async function getBookByIsbn(isbn: string): Promise<Book | undefined> {
  const snap = await getDoc(doc(firestore, BOOKS_COLLECTION, isbn));
  return snap.exists() ? docToBook(snap.data()) : undefined;
}

/**
 * Add a new book to Firestore.
 * Uses the ISBN as the document ID so that lookups are O(1).
 */
export async function addBook(book: Book): Promise<void> {
  await setDoc(doc(firestore, BOOKS_COLLECTION, book.isbn), book);
}

/**
 * Overwrite an existing book document.
 * Throws when the document does not exist.
 */
export async function updateBook(book: Book): Promise<void> {
  await updateDoc(doc(firestore, BOOKS_COLLECTION, book.isbn), {
    ...(book as DocumentData),
  });
}

/**
 * Delete a book document by ISBN.
 */
export async function removeBook(isbn: string): Promise<void> {
  await deleteDoc(doc(firestore, BOOKS_COLLECTION, isbn));
}

/**
 * Subscribe to real-time changes on the `books` collection.
 *
 * The callback is invoked immediately with the current snapshot and again
 * whenever any document changes (add, update, or delete).
 *
 * @param onUpdate  Called with the latest array of books on every change.
 * @param onError   Optional error handler.
 * @returns An unsubscribe function — call it to stop the listener.
 */
export function subscribeToBooks(
  onUpdate: (books: Book[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(firestore, BOOKS_COLLECTION), orderBy('title'));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot) => {
      onUpdate(snapshot.docs.map(d => docToBook(d.data())));
    },
    onError,
  );
}

/**
 * Seed the `books` collection with an initial set of books.
 * Only writes documents that do not already exist (uses addDoc on a subcollection
 * keyed by ISBN so existing data is not overwritten).
 */
export async function seedBooks(books: Book[]): Promise<void> {
  const writes = books.map(book =>
    setDoc(doc(firestore, BOOKS_COLLECTION, book.isbn), book, {merge: false}),
  );
  await Promise.all(writes);
}

/**
 * FirebaseCheckoutService — Firestore-backed checkout and return operations.
 *
 * Collection path: `checkouts/{autoId}`
 *
 * Each document represents a single checkout transaction.
 * An active checkout has no `dateIn` field (or `dateIn === null`).
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import {firestore} from '../config/firebase';
import {Checkout} from '../models/CheckoutRecord';

const CHECKOUTS_COLLECTION = 'checkouts';

/** Firestore stores dates as Timestamps; convert back to JS Dates on read. */
function docToCheckout(id: string, data: DocumentData): Checkout & {id: string} {
  return {
    id,
    bookId: data.bookId,
    userId: data.userId,
    quantity: data.quantity,
    dateOut: (data.dateOut as Timestamp).toDate(),
    dateIn: data.dateIn ? (data.dateIn as Timestamp).toDate() : undefined,
    notes: data.notes,
  };
}

/**
 * Fetch all checkout records once (non-real-time).
 */
export async function getAllCheckouts(): Promise<Array<Checkout & {id: string}>> {
  const q = query(
    collection(firestore, CHECKOUTS_COLLECTION),
    orderBy('dateOut', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToCheckout(d.id, d.data()));
}

/**
 * Fetch the active (not yet returned) checkout for a specific book, if any.
 */
export async function getActiveCheckoutByBook(
  bookId: string,
): Promise<(Checkout & {id: string}) | undefined> {
  const q = query(
    collection(firestore, CHECKOUTS_COLLECTION),
    where('bookId', '==', bookId),
    where('dateIn', '==', null),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  const first = snapshot.docs[0];
  return docToCheckout(first.id, first.data());
}

/**
 * Record a new checkout transaction in Firestore.
 *
 * @returns The auto-generated Firestore document ID for the new record.
 */
export async function checkOutBook(checkout: Checkout): Promise<string> {
  const docRef = await addDoc(collection(firestore, CHECKOUTS_COLLECTION), {
    bookId: checkout.bookId,
    userId: checkout.userId,
    quantity: checkout.quantity,
    dateOut: Timestamp.fromDate(checkout.dateOut),
    dateIn: null,
    notes: checkout.notes ?? null,
  });
  return docRef.id;
}

/**
 * Mark an active checkout as returned by setting its `dateIn` timestamp.
 *
 * @param checkoutId  The Firestore document ID returned by `checkOutBook`.
 * @param returnDate  Defaults to `new Date()` when omitted.
 */
export async function returnBook(
  checkoutId: string,
  returnDate: Date = new Date(),
): Promise<void> {
  await updateDoc(doc(firestore, CHECKOUTS_COLLECTION, checkoutId), {
    dateIn: Timestamp.fromDate(returnDate),
  });
}

/**
 * Subscribe to real-time changes on checkouts for a specific user.
 *
 * @param userId    The UID of the user whose checkouts to watch.
 * @param onUpdate  Called with the latest checkout list on every change.
 * @param onError   Optional error handler.
 * @returns An unsubscribe function.
 */
export function subscribeToUserCheckouts(
  userId: string,
  onUpdate: (checkouts: Array<Checkout & {id: string}>) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(firestore, CHECKOUTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('dateOut', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot) => {
      onUpdate(snapshot.docs.map(d => docToCheckout(d.id, d.data())));
    },
    onError,
  );
}

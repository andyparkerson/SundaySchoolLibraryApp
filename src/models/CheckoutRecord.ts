/**
 * Represents a checkout transaction — a user borrowing one or more copies of a book.
 */
export interface Checkout {
  /** ISBN of the book being checked out */
  bookId: string;
  /** Unique identifier of the user performing the checkout */
  userId: string;
  /** Number of copies checked out in this transaction */
  quantity: number;
  /** Date and time the book was checked out */
  dateOut: Date;
  /** Date and time the book was returned; undefined while still checked out */
  dateIn?: Date;
  /** Optional librarian or patron notes for this checkout */
  notes?: string;
}

/**
 * Validates a Checkout object, returning an array of human-readable error messages.
 * Returns an empty array when the object is valid.
 *
 * @param checkout - A full or partial Checkout object to validate.
 */
export function validateCheckout(checkout: Partial<Checkout>): string[] {
  const errors: string[] = [];

  if (!checkout.bookId || checkout.bookId.trim() === '') {
    errors.push('bookId is required');
  }

  if (!checkout.userId || checkout.userId.trim() === '') {
    errors.push('userId is required');
  }

  if (checkout.quantity === undefined || checkout.quantity === null) {
    errors.push('quantity is required');
  } else if (!Number.isInteger(checkout.quantity) || checkout.quantity <= 0) {
    errors.push('quantity must be a positive integer');
  }

  if (
    !checkout.dateOut ||
    !(checkout.dateOut instanceof Date) ||
    isNaN(checkout.dateOut.getTime())
  ) {
    errors.push('dateOut must be a valid Date');
  }

  if (
    checkout.dateIn !== undefined &&
    (!(checkout.dateIn instanceof Date) || isNaN(checkout.dateIn.getTime()))
  ) {
    errors.push('dateIn must be a valid Date when provided');
  }

  if (
    checkout.dateOut instanceof Date &&
    checkout.dateIn instanceof Date &&
    checkout.dateIn < checkout.dateOut
  ) {
    errors.push('dateIn cannot be before dateOut');
  }

  return errors;
}

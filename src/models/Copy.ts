/**
 * Possible statuses for a physical copy of a book.
 */
export enum CopyStatus {
  /** The copy is on the shelf and available for checkout */
  Available = 'available',
  /** The copy is currently checked out by a user */
  CheckedOut = 'checked_out',
  /** The copy has been reported lost */
  Lost = 'lost',
  /** The copy is damaged and not available for checkout */
  Damaged = 'damaged',
}

/**
 * Represents a single physical copy of a book held by the library.
 * Multiple Copy records may share the same bookId (ISBN).
 */
export interface Copy {
  /** ISBN of the parent book this copy belongs to */
  bookId: string;
  /** Unique identifier for this individual physical copy */
  copyId: string;
  /** Current status of this physical copy */
  status: CopyStatus;
}

/**
 * Validates a Copy object, returning an array of human-readable error messages.
 * Returns an empty array when the object is valid.
 *
 * @param copy - A full or partial Copy object to validate.
 */
export function validateCopy(copy: Partial<Copy>): string[] {
  const errors: string[] = [];

  if (!copy.bookId || copy.bookId.trim() === '') {
    errors.push('bookId is required');
  }

  if (!copy.copyId || copy.copyId.trim() === '') {
    errors.push('copyId is required');
  }

  if (
    !copy.status ||
    !Object.values(CopyStatus).includes(copy.status as CopyStatus)
  ) {
    errors.push(
      `status must be one of: ${Object.values(CopyStatus).join(', ')}`,
    );
  }

  return errors;
}

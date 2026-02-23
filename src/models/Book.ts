/**
 * Represents a book title in the Sunday School Library.
 * The ISBN uniquely identifies a book title across all copies.
 */
export interface Book {
  /** International Standard Book Number — unique identifier for this book title */
  isbn: string;
  /** Display title of the book */
  title: string;
  /** One or more author names */
  authors: string[];
  /** Optional edition descriptor (e.g. "2nd Edition") */
  edition?: string;
  /** Optional short description of the book's content */
  synopsis?: string;
  /** Optional topic tags for categorisation and search */
  tags?: string[];
  /** Total number of physical copies owned by the library */
  totalCopies: number;
  /** Number of copies currently available for checkout */
  availableCopies: number;
}

/**
 * Validates a Book object, returning an array of human-readable error messages.
 * Returns an empty array when the object is valid.
 *
 * @param book - A full or partial Book object to validate.
 */
export function validateBook(book: Partial<Book>): string[] {
  const errors: string[] = [];

  if (!book.isbn || book.isbn.trim() === '') {
    errors.push('isbn is required');
  }

  if (!book.title || book.title.trim() === '') {
    errors.push('title is required');
  }

  if (!book.authors || book.authors.length === 0) {
    errors.push('authors must contain at least one entry');
  }

  if (book.totalCopies === undefined || book.totalCopies === null) {
    errors.push('totalCopies is required');
  } else if (!Number.isInteger(book.totalCopies) || book.totalCopies < 0) {
    errors.push('totalCopies must be a non-negative integer');
  }

  if (book.availableCopies === undefined || book.availableCopies === null) {
    errors.push('availableCopies is required');
  } else if (
    !Number.isInteger(book.availableCopies) ||
    book.availableCopies < 0
  ) {
    errors.push('availableCopies must be a non-negative integer');
  }

  if (
    book.totalCopies !== undefined &&
    book.availableCopies !== undefined &&
    book.availableCopies > book.totalCopies
  ) {
    errors.push('availableCopies cannot exceed totalCopies');
  }

  return errors;
}

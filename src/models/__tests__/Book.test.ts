import {Book, validateBook} from '../Book';

describe('validateBook', () => {
  const validBook: Book = {
    isbn: '9780781444996',
    title: 'The Action Bible',
    authors: ['Doug Mauss'],
    totalCopies: 3,
    availableCopies: 2,
  };

  it('returns no errors for a valid book', () => {
    expect(validateBook(validBook)).toEqual([]);
  });

  it('returns no errors for a valid book with optional fields', () => {
    const book: Book = {
      ...validBook,
      edition: '2nd Edition',
      synopsis: 'An illustrated retelling.',
      tags: ['bible', 'children'],
    };
    expect(validateBook(book)).toEqual([]);
  });

  it('requires isbn', () => {
    expect(validateBook({...validBook, isbn: ''})).toContain(
      'isbn is required',
    );
    expect(validateBook({...validBook, isbn: undefined as any})).toContain(
      'isbn is required',
    );
  });

  it('requires title', () => {
    expect(validateBook({...validBook, title: ''})).toContain(
      'title is required',
    );
  });

  it('requires at least one author', () => {
    expect(validateBook({...validBook, authors: []})).toContain(
      'authors must contain at least one entry',
    );
    expect(validateBook({...validBook, authors: undefined as any})).toContain(
      'authors must contain at least one entry',
    );
  });

  it('requires totalCopies', () => {
    expect(
      validateBook({...validBook, totalCopies: undefined as any}),
    ).toContain('totalCopies is required');
  });

  it('rejects negative totalCopies', () => {
    expect(validateBook({...validBook, totalCopies: -1})).toContain(
      'totalCopies must be a non-negative integer',
    );
  });

  it('requires availableCopies', () => {
    expect(
      validateBook({...validBook, availableCopies: undefined as any}),
    ).toContain('availableCopies is required');
  });

  it('rejects availableCopies greater than totalCopies', () => {
    expect(
      validateBook({...validBook, totalCopies: 2, availableCopies: 5}),
    ).toContain('availableCopies cannot exceed totalCopies');
  });

  it('allows availableCopies equal to totalCopies', () => {
    expect(
      validateBook({...validBook, totalCopies: 3, availableCopies: 3}),
    ).toEqual([]);
  });

  it('allows zero availableCopies', () => {
    expect(
      validateBook({...validBook, totalCopies: 2, availableCopies: 0}),
    ).toEqual([]);
  });
});

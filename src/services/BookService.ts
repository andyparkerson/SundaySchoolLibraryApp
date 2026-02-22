import {Book} from '../models/Book';
import {SAMPLE_BOOKS} from '../data/sampleBooks';

let books: Book[] = [...SAMPLE_BOOKS];

export const BookService = {
  getAll(): Book[] {
    return books;
  },

  getById(isbn: string): Book | undefined {
    return books.find(b => b.isbn === isbn);
  },

  add(book: Book): void {
    books.push(book);
  },

  update(updated: Book): void {
    books = books.map(b => (b.isbn === updated.isbn ? updated : b));
  },

  remove(isbn: string): void {
    books = books.filter(b => b.isbn !== isbn);
  },
};

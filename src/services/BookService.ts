import {Book} from '../models/Book';
import {SAMPLE_BOOKS} from '../data/sampleBooks';

let books: Book[] = [...SAMPLE_BOOKS];

export const BookService = {
  getAll(): Book[] {
    return books;
  },

  getById(id: string): Book | undefined {
    return books.find(b => b.id === id);
  },

  add(book: Book): void {
    books.push(book);
  },

  update(updated: Book): void {
    books = books.map(b => (b.id === updated.id ? updated : b));
  },

  remove(id: string): void {
    books = books.filter(b => b.id !== id);
  },
};

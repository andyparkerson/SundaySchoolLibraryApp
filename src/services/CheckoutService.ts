import {Checkout} from '../models/CheckoutRecord';

let records: Checkout[] = [];

export const CheckoutService = {
  getAll(): Checkout[] {
    return records;
  },

  getActiveByBook(bookId: string): Checkout | undefined {
    return records.find(r => r.bookId === bookId && !r.dateIn);
  },

  checkOut(record: Checkout): void {
    records.push(record);
  },

  returnBook(bookId: string, userId: string): boolean {
    let found = false;
    records = records.map(r => {
      if (r.bookId === bookId && r.userId === userId && !r.dateIn) {
        found = true;
        return {...r, dateIn: new Date()};
      }
      return r;
    });
    return found;
  },
};

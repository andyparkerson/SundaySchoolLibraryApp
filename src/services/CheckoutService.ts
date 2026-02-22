import {CheckoutRecord} from '../models/CheckoutRecord';

let records: CheckoutRecord[] = [];

export const CheckoutService = {
  getAll(): CheckoutRecord[] {
    return records;
  },

  getActiveByBook(bookId: string): CheckoutRecord | undefined {
    return records.find(r => r.bookId === bookId && !r.returnedAt);
  },

  checkOut(record: CheckoutRecord): void {
    records.push(record);
  },

  returnBook(id: string): void {
    records = records.map(r =>
      r.id === id ? {...r, returnedAt: new Date()} : r,
    );
  },
};

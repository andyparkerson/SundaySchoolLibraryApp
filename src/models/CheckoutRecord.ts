export interface CheckoutRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  checkedOutAt: Date;
  returnedAt?: Date;
}

import {Checkout, validateCheckout} from '../CheckoutRecord';

describe('validateCheckout', () => {
  const now = new Date('2024-01-10T10:00:00Z');
  const later = new Date('2024-01-17T10:00:00Z');

  const validCheckout: Checkout = {
    bookId: '9780781444996',
    userId: 'user-001',
    quantity: 1,
    dateOut: now,
  };

  it('returns no errors for a valid checkout', () => {
    expect(validateCheckout(validCheckout)).toEqual([]);
  });

  it('returns no errors with all optional fields provided', () => {
    const checkout: Checkout = {
      ...validCheckout,
      dateIn: later,
      notes: 'Borrowed for Sunday class',
    };
    expect(validateCheckout(checkout)).toEqual([]);
  });

  it('requires bookId', () => {
    expect(validateCheckout({...validCheckout, bookId: ''})).toContain(
      'bookId is required',
    );
  });

  it('requires userId', () => {
    expect(validateCheckout({...validCheckout, userId: ''})).toContain(
      'userId is required',
    );
  });

  it('requires quantity', () => {
    expect(
      validateCheckout({...validCheckout, quantity: undefined as any}),
    ).toContain('quantity is required');
  });

  it('rejects non-positive quantity', () => {
    expect(validateCheckout({...validCheckout, quantity: 0})).toContain(
      'quantity must be a positive integer',
    );
    expect(validateCheckout({...validCheckout, quantity: -1})).toContain(
      'quantity must be a positive integer',
    );
  });

  it('rejects non-integer quantity', () => {
    expect(validateCheckout({...validCheckout, quantity: 1.5})).toContain(
      'quantity must be a positive integer',
    );
  });

  it('requires a valid dateOut', () => {
    expect(
      validateCheckout({...validCheckout, dateOut: undefined as any}),
    ).toContain('dateOut must be a valid Date');
    expect(
      validateCheckout({...validCheckout, dateOut: new Date('invalid')}),
    ).toContain('dateOut must be a valid Date');
  });

  it('rejects an invalid dateIn', () => {
    expect(
      validateCheckout({
        ...validCheckout,
        dateIn: new Date('not-a-date'),
      }),
    ).toContain('dateIn must be a valid Date when provided');
  });

  it('rejects dateIn before dateOut', () => {
    expect(
      validateCheckout({...validCheckout, dateOut: later, dateIn: now}),
    ).toContain('dateIn cannot be before dateOut');
  });

  it('allows dateIn equal to dateOut', () => {
    expect(
      validateCheckout({...validCheckout, dateOut: now, dateIn: now}),
    ).toEqual([]);
  });
});

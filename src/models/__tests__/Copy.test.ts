import {Copy, CopyStatus, validateCopy} from '../Copy';

describe('CopyStatus enum', () => {
  it('has expected values', () => {
    expect(CopyStatus.Available).toBe('available');
    expect(CopyStatus.CheckedOut).toBe('checked_out');
    expect(CopyStatus.Lost).toBe('lost');
    expect(CopyStatus.Damaged).toBe('damaged');
  });
});

describe('validateCopy', () => {
  const validCopy: Copy = {
    bookId: '9780781444996',
    copyId: 'copy-001',
    status: CopyStatus.Available,
  };

  it('returns no errors for a valid copy', () => {
    expect(validateCopy(validCopy)).toEqual([]);
  });

  it('accepts all valid statuses', () => {
    Object.values(CopyStatus).forEach(status => {
      expect(validateCopy({...validCopy, status})).toEqual([]);
    });
  });

  it('requires bookId', () => {
    expect(validateCopy({...validCopy, bookId: ''})).toContain(
      'bookId is required',
    );
    expect(validateCopy({...validCopy, bookId: undefined as any})).toContain(
      'bookId is required',
    );
  });

  it('requires copyId', () => {
    expect(validateCopy({...validCopy, copyId: ''})).toContain(
      'copyId is required',
    );
  });

  it('rejects an invalid status', () => {
    expect(
      validateCopy({...validCopy, status: 'unknown' as CopyStatus}),
    ).toContain(
      'status must be one of: available, checked_out, lost, damaged',
    );
  });

  it('requires status', () => {
    expect(validateCopy({...validCopy, status: undefined as any})).toContain(
      'status must be one of: available, checked_out, lost, damaged',
    );
  });
});

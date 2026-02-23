import {User, UserRole, validateUser} from '../User';

describe('UserRole enum', () => {
  it('has expected values', () => {
    expect(UserRole.Librarian).toBe('librarian');
    expect(UserRole.Instructor).toBe('instructor');
    expect(UserRole.GeneralUser).toBe('general_user');
  });
});

describe('validateUser', () => {
  const validUser: User = {
    userId: 'user-001',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: UserRole.GeneralUser,
  };

  it('returns no errors for a valid user', () => {
    expect(validateUser(validUser)).toEqual([]);
  });

  it('accepts all valid roles', () => {
    Object.values(UserRole).forEach(role => {
      expect(validateUser({...validUser, role})).toEqual([]);
    });
  });

  it('requires userId', () => {
    expect(validateUser({...validUser, userId: ''})).toContain(
      'userId is required',
    );
    expect(validateUser({...validUser, userId: undefined as any})).toContain(
      'userId is required',
    );
  });

  it('requires name', () => {
    expect(validateUser({...validUser, name: ''})).toContain(
      'name is required',
    );
  });

  it('requires a valid email', () => {
    expect(validateUser({...validUser, email: ''})).toContain(
      'email must be a valid email address',
    );
    expect(validateUser({...validUser, email: 'not-an-email'})).toContain(
      'email must be a valid email address',
    );
    expect(validateUser({...validUser, email: 'missing@'})).toContain(
      'email must be a valid email address',
    );
  });

  it('accepts a well-formed email', () => {
    expect(validateUser({...validUser, email: 'user@church.org'})).toEqual([]);
  });

  it('requires a valid role', () => {
    expect(
      validateUser({...validUser, role: 'unknown' as UserRole}),
    ).toContain(
      'role must be one of: librarian, instructor, general_user',
    );
    expect(validateUser({...validUser, role: undefined as any})).toContain(
      'role must be one of: librarian, instructor, general_user',
    );
  });
});

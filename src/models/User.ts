/**
 * Roles available to library users, controlling access and permissions.
 */
export enum UserRole {
  /** Full administrative access — can manage books, copies, users, and checkouts */
  Librarian = 'librarian',
  /** Instructor-level access — can browse and checkout books for class use */
  Instructor = 'instructor',
  /** Standard patron access — can browse books and manage their own checkouts */
  GeneralUser = 'general_user',
}

/**
 * Represents a registered user of the Sunday School Library.
 */
export interface User {
  /** Unique identifier for the user */
  userId: string;
  /** Full display name of the user */
  name: string;
  /** Contact email address */
  email: string;
  /** Permission role that determines what the user can do in the app */
  role: UserRole;
}

/** Basic email format validation regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a User object, returning an array of human-readable error messages.
 * Returns an empty array when the object is valid.
 *
 * @param user - A full or partial User object to validate.
 */
export function validateUser(user: Partial<User>): string[] {
  const errors: string[] = [];

  if (!user.userId || user.userId.trim() === '') {
    errors.push('userId is required');
  }

  if (!user.name || user.name.trim() === '') {
    errors.push('name is required');
  }

  if (!user.email || !EMAIL_REGEX.test(user.email)) {
    errors.push('email must be a valid email address');
  }

  if (!user.role || !Object.values(UserRole).includes(user.role as UserRole)) {
    errors.push(`role must be one of: ${Object.values(UserRole).join(', ')}`);
  }

  return errors;
}

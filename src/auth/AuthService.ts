import {User, UserRole} from '../models/User';

export type {User as AuthUser};
export {UserRole};

let currentUser: User | null = null;

export const AuthService = {
  login(user: User): void {
    currentUser = user;
  },

  logout(): void {
    currentUser = null;
  },

  getCurrentUser(): User | null {
    return currentUser;
  },

  isAuthenticated(): boolean {
    return currentUser !== null;
  },
};

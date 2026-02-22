export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'librarian' | 'viewer';
}

let currentUser: AuthUser | null = null;

export const AuthService = {
  login(user: AuthUser): void {
    currentUser = user;
  },

  logout(): void {
    currentUser = null;
  },

  getCurrentUser(): AuthUser | null {
    return currentUser;
  },

  isAuthenticated(): boolean {
    return currentUser !== null;
  },
};

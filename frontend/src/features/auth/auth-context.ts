import { createContext } from 'react';

import type { LoginRequest, User } from '@/api/types';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

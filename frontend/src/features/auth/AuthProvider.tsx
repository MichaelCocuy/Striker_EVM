import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { api } from '@/api/endpoints';
import { clearSession, getSession, setSession, subscribeToSession } from '@/session/session-store';

import { AuthContext } from './auth-context';

import type { AuthContextValue } from './auth-context';
import type { Api } from '@/api/endpoints';
import type { LoginRequest, User } from '@/api/types';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  /** Injectable for tests; defaults to the real typed API. */
  authApi?: Pick<Api, 'login'>;
}

export function AuthProvider({ children, authApi = api }: AuthProviderProps) {
  const session = useSyncExternalStore(subscribeToSession, getSession, getSession);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<User> => {
      const response = await authApi.login(credentials);
      setSession({ accessToken: response.accessToken, user: response.user });
      return response.user;
    },
    [authApi],
  );

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { STORAGE_KEYS } from '@/constants/storage-keys';

import type { User } from '@/api/types';

/**
 * Authenticated session shared by the AuthProvider (React) and the API client (plain TS).
 * The token lives in memory and is mirrored to sessionStorage so a page reload keeps the
 * user signed in for the lifetime of the tab, as required by ARQUITECTURA §11.
 */
export interface Session {
  accessToken: string;
  user: User;
}

type Listener = () => void;

let currentSession: Session | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Session>;
  return typeof candidate.accessToken === 'string' && typeof candidate.user === 'object';
}

function readPersistedSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: Session | null): void {
  try {
    if (session === null) {
      window.sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      window.sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch {
    // Storage can be unavailable (private mode, quota); the in-memory session still works.
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getSession(): Session | null {
  if (!hydrated) {
    currentSession = readPersistedSession();
    hydrated = true;
  }
  return currentSession;
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function setSession(session: Session): void {
  currentSession = session;
  hydrated = true;
  persistSession(session);
  notify();
}

export function clearSession(): void {
  currentSession = null;
  hydrated = true;
  persistSession(null);
  notify();
}

export function subscribeToSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

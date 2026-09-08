const DEFAULT_API_BASE_URL = '/api/v1';
const TRUE_LITERAL = 'true';

function readString(value: string | undefined, fallback: string): string {
  return value !== undefined && value.trim() !== '' ? value : fallback;
}

function readBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === TRUE_LITERAL;
}

export const env = {
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, DEFAULT_API_BASE_URL),
  useMocks: readBoolean(import.meta.env.VITE_USE_MOCKS),
  isDevelopment: import.meta.env.DEV,
} as const;

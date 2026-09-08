import type { ApiErrorBody } from './types';

export const API_ERROR_CODE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
} as const;

/** Every failure surfaced by the API client, normalized to the contract's Error shape. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiErrorBody>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

export function normalizeErrorBody(raw: unknown, fallbackMessage: string): ApiErrorBody {
  if (isApiErrorBody(raw)) {
    return { code: raw.code, message: raw.message, details: raw.details ?? [] };
  }
  return { code: API_ERROR_CODE.HTTP_ERROR, message: fallbackMessage, details: [] };
}

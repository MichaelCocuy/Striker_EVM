import { ERROR_CODE } from './types';

import type { ApiErrorBody, ErrorCode, ErrorDetail } from './types';

export { ERROR_CODE } from './types';

const KNOWN_ERROR_CODES: readonly string[] = Object.values(ERROR_CODE);

/** Every failure surfaced by the API client, normalized to the contract's Error shape. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];

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

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && KNOWN_ERROR_CODES.includes(value);
}

function isErrorDetail(value: unknown): value is ErrorDetail {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<ErrorDetail>).message === 'string'
  );
}

function readDetails(value: unknown): ErrorDetail[] {
  return Array.isArray(value) ? value.filter(isErrorDetail) : [];
}

/**
 * Accepts whatever the server sent and returns a body that satisfies the contract:
 * unknown codes fall back to HTTP_ERROR while the human-readable message is preserved.
 */
export function normalizeErrorBody(raw: unknown, fallbackMessage: string): ApiErrorBody {
  if (typeof raw !== 'object' || raw === null) {
    return { code: ERROR_CODE.HTTP_ERROR, message: fallbackMessage, details: [] };
  }
  const candidate = raw as Partial<Record<keyof ApiErrorBody, unknown>>;
  const message = typeof candidate.message === 'string' ? candidate.message : fallbackMessage;
  return {
    code: isErrorCode(candidate.code) ? candidate.code : ERROR_CODE.HTTP_ERROR,
    message,
    details: readDetails(candidate.details),
  };
}

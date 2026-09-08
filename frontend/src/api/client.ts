import { env } from '@/config/env';
import { BEARER_PREFIX, HTTP_HEADER, HTTP_METHOD, HTTP_STATUS, MEDIA_TYPE } from '@/constants/http';
import { clearSession, getAccessToken } from '@/session/session-store';

import { API_ERROR_CODE, ApiError, normalizeErrorBody } from './errors';

import type { HttpMethod } from '@/constants/http';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Public endpoints (login, health) skip the bearer token and the 401 → logout rule. */
  requiresAuth?: boolean;
  signal?: AbortSignal;
}

const NETWORK_ERROR_MESSAGE = 'No se pudo contactar al servidor';
const INVALID_RESPONSE_MESSAGE = 'La respuesta del servidor no es JSON válido';

function buildUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

function buildHeaders(hasBody: boolean, requiresAuth: boolean): Headers {
  const headers = new Headers({ [HTTP_HEADER.ACCEPT]: MEDIA_TYPE.JSON });
  if (hasBody) {
    headers.set(HTTP_HEADER.CONTENT_TYPE, MEDIA_TYPE.JSON);
  }
  if (requiresAuth) {
    const token = getAccessToken();
    if (token !== null) {
      headers.set(HTTP_HEADER.AUTHORIZATION, `${BEARER_PREFIX}${token}`);
    }
  }
  return headers;
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(response.status, {
      code: API_ERROR_CODE.INVALID_RESPONSE,
      message: INVALID_RESPONSE_MESSAGE,
      details: [],
    });
  }
}

async function throwNormalizedError(response: Response, requiresAuth: boolean): Promise<never> {
  if (requiresAuth && response.status === HTTP_STATUS.UNAUTHORIZED) {
    clearSession();
  }
  let rawBody: unknown;
  try {
    rawBody = await readJsonBody(response);
  } catch {
    rawBody = undefined;
  }
  throw new ApiError(response.status, normalizeErrorBody(rawBody, response.statusText));
}

export interface ApiClient {
  request<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
}

/** Resolved per call so test tooling (MSW) that patches globalThis.fetch is honored. */
const defaultFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

export function createApiClient(
  baseUrl: string,
  fetchImpl: typeof fetch = defaultFetch,
): ApiClient {
  return {
    async request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
      const { method = HTTP_METHOD.GET, body, requiresAuth = true, signal } = options;
      const hasBody = body !== undefined;

      let response: Response;
      try {
        response = await fetchImpl(buildUrl(baseUrl, path), {
          method,
          headers: buildHeaders(hasBody, requiresAuth),
          ...(hasBody ? { body: JSON.stringify(body) } : {}),
          ...(signal ? { signal } : {}),
        });
      } catch (error) {
        throw new ApiError(0, {
          code: API_ERROR_CODE.NETWORK_ERROR,
          message: error instanceof Error ? error.message : NETWORK_ERROR_MESSAGE,
          details: [],
        });
      }

      if (!response.ok) {
        return throwNormalizedError(response, requiresAuth);
      }
      if (response.status === HTTP_STATUS.NO_CONTENT) {
        return undefined as TResponse;
      }
      return (await readJsonBody(response)) as TResponse;
    },
  };
}

export const apiClient = createApiClient(env.apiBaseUrl);

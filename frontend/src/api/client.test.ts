import { describe, expect, it, vi } from 'vitest';

import { ROLES } from '@/api/types';
import { HTTP_HEADER, HTTP_STATUS } from '@/constants/http';
import { getSession, setSession } from '@/session/session-store';
import { TEST_TOKEN, TEST_USERS } from '@/test/render';

import { createApiClient } from './client';
import { createApi } from './endpoints';
import { ERROR_CODE, ApiError } from './errors';

const BASE_URL = 'http://api.test/api/v1';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { [HTTP_HEADER.CONTENT_TYPE]: 'application/json' },
  });
}

function mockFetch(response: Response) {
  return vi.fn<typeof fetch>().mockResolvedValue(response);
}

describe('api client', () => {
  it('attaches the bearer token from the session to authenticated requests', async () => {
    setSession({ accessToken: TEST_TOKEN, user: TEST_USERS[ROLES.REVIEWER] });
    const fetchSpy = mockFetch(jsonResponse([], HTTP_STATUS.OK));
    const api = createApi(createApiClient(BASE_URL, fetchSpy));

    await api.listProjects();

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE_URL}/projects`);
    expect(new Headers(init?.headers).get(HTTP_HEADER.AUTHORIZATION)).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('does not send a token on public endpoints and serializes the JSON body', async () => {
    setSession({ accessToken: TEST_TOKEN, user: TEST_USERS[ROLES.REVIEWER] });
    const fetchSpy = mockFetch(jsonResponse({}, HTTP_STATUS.OK));
    const api = createApi(createApiClient(BASE_URL, fetchSpy));
    const credentials = { email: 'a@b.co', password: 'secret-pass' };

    await api.login(credentials);

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).has(HTTP_HEADER.AUTHORIZATION)).toBe(false);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(credentials));
  });

  it('normalizes error bodies into ApiError with code, message and details', async () => {
    const errorBody = {
      code: 'VALIDATION_ERROR',
      message: 'bad input',
      details: [{ field: 'name', message: 'name must not be empty' }],
    };
    const api = createApi(
      createApiClient(BASE_URL, mockFetch(jsonResponse(errorBody, HTTP_STATUS.BAD_REQUEST))),
    );

    const failure = await api.createProject({ name: '' }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    const apiError = failure as ApiError;
    expect(apiError.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(apiError.code).toBe(errorBody.code);
    expect(apiError.message).toBe(errorBody.message);
    expect(apiError.details).toEqual(errorBody.details);
  });

  it('falls back to a generic HTTP error when the body is not the contract shape', async () => {
    const response = new Response('<html>oops</html>', {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      statusText: 'Internal Server Error',
    });
    const api = createApi(createApiClient(BASE_URL, mockFetch(response)));

    const failure = (await api.listProjects().catch((error: unknown) => error)) as ApiError;

    expect(failure.code).toBe(ERROR_CODE.HTTP_ERROR);
    expect(failure.message).toBe('Internal Server Error');
  });

  it('clears the session on a 401 from an authenticated endpoint', async () => {
    setSession({ accessToken: TEST_TOKEN, user: TEST_USERS[ROLES.REVIEWER] });
    const unauthorized = jsonResponse(
      { code: 'UNAUTHORIZED', message: 'expired', details: [] },
      HTTP_STATUS.UNAUTHORIZED,
    );
    const api = createApi(createApiClient(BASE_URL, mockFetch(unauthorized)));

    await expect(api.getMe()).rejects.toBeInstanceOf(ApiError);
    expect(getSession()).toBeNull();
  });

  it('returns undefined for 204 responses', async () => {
    const api = createApi(
      createApiClient(BASE_URL, mockFetch(new Response(null, { status: HTTP_STATUS.NO_CONTENT }))),
    );

    await expect(api.deleteProject('p1')).resolves.toBeUndefined();
  });

  it('wraps network failures as NETWORK_ERROR', async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const api = createApi(createApiClient(BASE_URL, fetchSpy));

    const failure = (await api.listProjects().catch((error: unknown) => error)) as ApiError;

    expect(failure.code).toBe(ERROR_CODE.NETWORK_ERROR);
    expect(failure.status).toBe(0);
  });
});

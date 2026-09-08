import { useCallback, useEffect, useState } from 'react';

import { API_ERROR_CODE, ApiError, isApiError } from './errors';

export type QueryStatus = 'loading' | 'success' | 'error';

export interface ApiQueryState<TData> {
  status: QueryStatus;
  data: TData | null;
  error: ApiError | null;
  refetch: () => void;
}

type Fetcher<TData> = (signal: AbortSignal) => Promise<TData>;

interface SettledResult<TData> {
  fetcher: Fetcher<TData>;
  attempt: number;
  data: TData | null;
  error: ApiError | null;
}

const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado';

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  return new ApiError(0, {
    code: API_ERROR_CODE.NETWORK_ERROR,
    message: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
    details: [],
  });
}

/**
 * Minimal loading/success/error state around an API call.
 * The `fetcher` must be referentially stable (wrap it in useCallback) because a new
 * function identity triggers a refetch; `refetch()` re-runs it on demand.
 * "Loading" is derived: a result only counts when it belongs to the current fetcher/attempt.
 */
export function useApiQuery<TData>(fetcher: Fetcher<TData>): ApiQueryState<TData> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<SettledResult<TData> | null>(null);

  const refetch = useCallback(() => {
    setAttempt((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setSettled({ fetcher, attempt, data, error: null });
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setSettled({ fetcher, attempt, data: null, error: toApiError(reason) });
        }
      });

    return () => {
      controller.abort();
    };
  }, [fetcher, attempt]);

  const isCurrent = settled !== null && settled.fetcher === fetcher && settled.attempt === attempt;
  if (!isCurrent) {
    return { status: 'loading', data: null, error: null, refetch };
  }
  return {
    status: settled.error === null ? 'success' : 'error',
    data: settled.data,
    error: settled.error,
    refetch,
  };
}

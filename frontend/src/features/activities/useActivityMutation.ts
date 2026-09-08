import { useCallback, useState } from 'react';

import { ERROR_CODE, ApiError, isApiError } from '@/api/errors';

const UNEXPECTED_ERROR_MESSAGE = 'No pudimos guardar los cambios. Inténtalo de nuevo.';

function toApiError(reason: unknown): ApiError {
  if (isApiError(reason)) {
    return reason;
  }
  return new ApiError(0, {
    code: ERROR_CODE.NETWORK_ERROR,
    message: reason instanceof Error ? reason.message : UNEXPECTED_ERROR_MESSAGE,
    details: [],
  });
}

export interface ActivityMutation {
  isPending: boolean;
  error: ApiError | null;
  /** Runs the request; `onSuccess` only fires when the API confirmed the change. */
  run: (request: () => Promise<unknown>, onSuccess: () => void) => Promise<void>;
}

interface MutationState {
  isPending: boolean;
  error: ApiError | null;
}

const IDLE: MutationState = { isPending: false, error: null };

/**
 * Pending and error state around a single write to the activities endpoints.
 * The caller decides what success means (close the dialog and refetch the report).
 */
export function useActivityMutation(): ActivityMutation {
  const [state, setState] = useState<MutationState>(IDLE);

  const run = useCallback(async (request: () => Promise<unknown>, onSuccess: () => void) => {
    setState({ isPending: true, error: null });
    try {
      await request();
    } catch (reason) {
      setState({ isPending: false, error: toApiError(reason) });
      return;
    }
    setState(IDLE);
    onSuccess();
  }, []);

  return { ...state, run };
}

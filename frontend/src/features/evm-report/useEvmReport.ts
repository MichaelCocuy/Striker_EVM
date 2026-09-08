import { useCallback } from 'react';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';

import type { EvmReport } from '@/api/types';
import type { ApiQueryState } from '@/api/useApiQuery';

/**
 * Single source of the dashboard's numbers: the backend recomputes the whole report on read,
 * so any change to an activity is reflected by calling `refetch()`. The UI never calculates
 * an indicator itself (ARQUITECTURA §10, decision 5).
 */
export function useEvmReport(projectId: string): ApiQueryState<EvmReport> {
  const fetchReport = useCallback(() => api.getEvmReport(projectId), [projectId]);
  return useApiQuery(fetchReport);
}

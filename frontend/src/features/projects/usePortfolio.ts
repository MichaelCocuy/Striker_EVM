import { useCallback } from 'react';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';

import type { EvmIndicators, Project } from '@/api/types';
import type { ApiQueryState } from '@/api/useApiQuery';

export interface PortfolioEntry {
  project: Project;
  /** Consolidated indicators of the project, or `null` when its report request failed. */
  indicators: EvmIndicators | null;
}

/**
 * One project's consolidated status. The failure is swallowed on purpose: a broken report must
 * not drop the project from the portfolio, it only leaves its status unknown.
 */
async function loadEntry(project: Project): Promise<PortfolioEntry> {
  try {
    const report = await api.getEvmReport(project.id);
    return { project, indicators: report.project.indicators };
  } catch {
    return { project, indicators: null };
  }
}

/**
 * Portfolio data: the project list plus every project's consolidated report, requested
 * concurrently so the page waits for the slowest report instead of for their sum.
 *
 * Honest limitation: this is N+1 requests (one list plus one report per project). It is fine
 * for the handful of projects in scope, but a portfolio-level endpoint (a single call returning
 * the consolidated indicators of every project) is the right answer as soon as the list grows.
 * Either way the UI only renders indicators the backend computed (ARQUITECTURA §10, decision 5).
 */
export function usePortfolio(): ApiQueryState<PortfolioEntry[]> {
  const fetchPortfolio = useCallback(async (): Promise<PortfolioEntry[]> => {
    const projects = await api.listProjects();
    return Promise.all(projects.map(loadEntry));
  }, []);

  return useApiQuery(fetchPortfolio);
}

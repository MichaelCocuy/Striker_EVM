import { useCallback } from 'react';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';

import type { EvmActivityReport, EvmProjectSummary, EvmReport } from '@/api/types';
import type { ApiQueryState } from '@/api/useApiQuery';

export interface OwnedActivity {
  project: EvmProjectSummary;
  activity: EvmActivityReport;
}

/**
 * The contract (ARQUITECTURA §5) has no "my activities" endpoint: reports are per project.
 * So the registrar's home lists the projects it can see and asks for one EVM report per
 * project, then keeps the activities the signed-in user owns. Indicators still come from the
 * server; nothing is recomputed here.
 */
export function useProjectReports(): ApiQueryState<EvmReport[]> {
  const fetchReports = useCallback(async () => {
    const projects = await api.listProjects();
    return Promise.all(projects.map((project) => api.getEvmReport(project.id)));
  }, []);
  return useApiQuery(fetchReports);
}

export function ownedActivitiesOf(reports: readonly EvmReport[], ownerId: string): OwnedActivity[] {
  return reports.flatMap((report) =>
    report.activities
      .filter((activity) => activity.owner.id === ownerId)
      .map((activity) => ({ project: report.project, activity })),
  );
}

/** Projects the user has work in, for the read-only status context. */
export function projectsOf(owned: readonly OwnedActivity[]): EvmProjectSummary[] {
  const byId = new Map<string, EvmProjectSummary>();
  for (const { project } of owned) {
    byId.set(project.id, project);
  }
  return [...byId.values()];
}

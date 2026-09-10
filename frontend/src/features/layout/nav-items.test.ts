import { describe, expect, it } from 'vitest';

import { ROLES } from '@/api/types';
import { projectDashboardPath, ROUTES } from '@/constants/routes';

import { navGroupsForRole } from './nav-items';

import type { NavGroup } from './nav-items';

const PROJECT_ID = '22222222-2222-4222-8222-000000000001';

const GROUP = { TRACKING: 'Seguimiento', MY_WORK: 'Mi trabajo' } as const;
const ITEM = {
  PORTFOLIO: 'Portafolio',
  DASHBOARD: 'Tablero del proyecto',
  MY_ACTIVITIES: 'Mis actividades',
} as const;

function titles(groups: NavGroup[]): string[] {
  return groups.map((group) => group.title);
}

function labelsOf(groups: NavGroup[], title: string): string[] {
  const group = groups.find((candidate) => candidate.title === title);
  if (group === undefined) {
    throw new Error(`The navigation has no group titled ${title}`);
  }
  return group.items.map((item) => item.label);
}

describe('navGroupsForRole', () => {
  it('gives a REVIEWER the tracking group and nothing of "mi trabajo"', () => {
    const groups = navGroupsForRole(ROLES.REVIEWER, null);

    expect(titles(groups)).toEqual([GROUP.TRACKING]);
    expect(labelsOf(groups, GROUP.TRACKING)).toEqual([ITEM.PORTFOLIO]);
  });

  it('gives a REGISTRAR only "mi trabajo" when no project is open', () => {
    const groups = navGroupsForRole(ROLES.REGISTRAR, null);

    expect(titles(groups)).toEqual([GROUP.MY_WORK]);
    expect(labelsOf(groups, GROUP.MY_WORK)).toEqual([ITEM.MY_ACTIVITIES]);
  });

  it('adds the project dashboard to both roles while a project is open', () => {
    const reviewerGroups = navGroupsForRole(ROLES.REVIEWER, PROJECT_ID);
    const registrarGroups = navGroupsForRole(ROLES.REGISTRAR, PROJECT_ID);

    expect(labelsOf(reviewerGroups, GROUP.TRACKING)).toEqual([ITEM.PORTFOLIO, ITEM.DASHBOARD]);
    expect(labelsOf(registrarGroups, GROUP.TRACKING)).toEqual([ITEM.DASHBOARD]);
    expect(titles(registrarGroups)).toEqual([GROUP.TRACKING, GROUP.MY_WORK]);
  });

  it('points the dashboard at the open project and the portfolio at its own route', () => {
    const groups = navGroupsForRole(ROLES.REVIEWER, PROJECT_ID);
    const destinations = groups.flatMap((group) => group.items.map((item) => item.to));

    expect(destinations).toEqual([ROUTES.PROJECTS, projectDashboardPath(PROJECT_ID)]);
  });

  it('carries an icon component on every item, never a glyph', () => {
    const groups = navGroupsForRole(ROLES.REVIEWER, PROJECT_ID);

    for (const item of groups.flatMap((group) => group.items)) {
      expect(item.icon).toBeDefined();
      expect(typeof item.icon).not.toBe('string');
    }
  });
});

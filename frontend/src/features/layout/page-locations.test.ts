import { describe, expect, it } from 'vitest';

import { projectDashboardPath, ROUTES } from '@/constants/routes';

import { pageLocationFor } from './page-locations';

const PROJECT_ID = '22222222-2222-4222-8222-000000000001';

describe('pageLocationFor', () => {
  it('names the portfolio and its crumb', () => {
    expect(pageLocationFor(ROUTES.PROJECTS)).toEqual({
      crumb: 'Portafolio',
      title: 'Todos los proyectos',
    });
  });

  it('keeps the portfolio as the crumb of a project dashboard', () => {
    expect(pageLocationFor(projectDashboardPath(PROJECT_ID))).toEqual({
      crumb: 'Portafolio',
      title: 'Tablero del proyecto',
    });
  });

  it('names my activities under my work', () => {
    expect(pageLocationFor(ROUTES.MY_ACTIVITIES)).toEqual({
      crumb: 'Mi trabajo',
      title: 'Mis actividades',
    });
  });

  it('falls back to the product itself on a route it does not know', () => {
    expect(pageLocationFor('/una-ruta-que-no-existe')).toEqual({
      crumb: 'Striker EVM',
      title: 'Valor ganado',
    });
  });
});

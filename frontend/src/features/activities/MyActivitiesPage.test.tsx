import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { mockDb, resetMockDatabase } from '@/mocks/db';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { MyActivitiesPage } from './MyActivitiesPage';

import type { RouteObject } from 'react-router-dom';

const PROJECT_NAME = 'Portal de clientes';
const OWNED_ACTIVITIES = ['Diseño', 'Pruebas'] as const;
const FOREIGN_ACTIVITY = 'Desarrollo';
const EMPTY_MESSAGE = 'No tienes actividades asignadas.';
const NEW_PROGRESS = '60';

const routes: RouteObject[] = [{ path: ROUTES.MY_ACTIVITIES, element: <MyActivitiesPage /> }];

function renderPage() {
  return renderWithRouter({ routes, initialPath: ROUTES.MY_ACTIVITIES });
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('MyActivitiesPage', () => {
  it('lists the activities the signed-in user owns with their project', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    for (const name of OWNED_ACTIVITIES) {
      const header = await screen.findByRole('rowheader', { name: new RegExp(name) });
      const row = header.closest('tr');
      expect(row).not.toBeNull();
      expect(within(row ?? header).getByText(PROJECT_NAME)).toBeInTheDocument();
    }
    expect(screen.queryByRole('rowheader', { name: FOREIGN_ACTIVITY })).toBeNull();
  });

  it('shows the consolidated status of each project as read-only context', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    await screen.findByRole('rowheader', { name: /Diseño/ });
    /** Consolidated indicators of docs/api/fixtures/evm-report.json. */
    expect(screen.getByText('Sobre presupuesto')).toBeInTheDocument();
    expect(screen.getAllByText('Atrasado')).not.toHaveLength(0);
  });

  it('explains that there is nothing assigned when the user owns no activity', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPage();

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('edits an owned activity and refetches the reports', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Diseño' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.clear(within(dialog).getByLabelText('% de avance real'));
    await userEvent.type(within(dialog).getByLabelText('% de avance real'), NEW_PROGRESS);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(
      mockDb.activities.find((activity) => activity.id === SEED_IDS.ACTIVITY_DESIGN),
    ).toMatchObject({ actualProgressPercent: 60 });
  });
});

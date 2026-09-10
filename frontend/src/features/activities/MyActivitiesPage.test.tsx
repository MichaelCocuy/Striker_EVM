import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { EVM_TONE } from '@/evm/tone';
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

/** Reading of the two activities Carlos owns in docs/api/fixtures/evm-report.json. */
const KPI = {
  ASSIGNED_COUNT: '2',
  ASSIGNED_CAPTION: 'actividades en 1 proyecto',
  BEHIND_COUNT: '0',
  BEHIND_CAPTION: 'ninguna actividad va por detrás de su plan',
  OWN_EARNED_VALUE: '13.000,00',
  EARNED_VALUE_CAPTION: 'de 29.000,00 de mis proyectos',
} as const;

const DESIGN_COST_CHIP = 'CPI 1,1111';
const DESIGN_SCHEDULE_CHIP = 'SPI 1,0000';
const REGISTER_DESIGN = 'Registrar avance de Diseño';
const PANEL_TITLE = 'Registrar avance';
const SAVE = 'Guardar avance';
const PROGRESS_FIELD = 'Avance real (%)';

const routes: RouteObject[] = [{ path: ROUTES.MY_ACTIVITIES, element: <MyActivitiesPage /> }];

function renderPage() {
  return renderWithRouter({ routes, initialPath: ROUTES.MY_ACTIVITIES });
}

function cardOf(activityName: string): HTMLElement {
  const article = screen.getByText(activityName).closest('article');
  if (article === null) {
    throw new Error(`The activity ${activityName} is not rendered as a card`);
  }
  return article;
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('MyActivitiesPage', () => {
  it('lists the activities the signed-in user owns as cards with their project', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    for (const name of OWNED_ACTIVITIES) {
      await screen.findByText(name);
      expect(within(cardOf(name)).getByText(PROJECT_NAME)).toBeInTheDocument();
    }
    expect(screen.queryByText(FOREIGN_ACTIVITY)).toBeNull();
  });

  it('sums the reported figures of the three KPIs', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    expect(await screen.findByText(KPI.ASSIGNED_COUNT)).toBeInTheDocument();
    expect(screen.getByText(KPI.ASSIGNED_CAPTION)).toBeInTheDocument();
    expect(screen.getByText(KPI.BEHIND_COUNT)).toBeInTheDocument();
    expect(screen.getByText(KPI.BEHIND_CAPTION)).toBeInTheDocument();
    expect(screen.getByText(KPI.OWN_EARNED_VALUE)).toBeInTheDocument();
    expect(screen.getByText(KPI.EARNED_VALUE_CAPTION)).toBeInTheDocument();
  });

  it('gives each card the plan against the real progress and both index chips', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    await screen.findByText(OWNED_ACTIVITIES[0]);
    const card = within(cardOf(OWNED_ACTIVITIES[0]));
    expect(card.getByText('Plan 100%')).toBeInTheDocument();
    expect(card.getByText('Real 100%')).toBeInTheDocument();
    expect(card.getByText(DESIGN_COST_CHIP)).toHaveAttribute('data-tone', EVM_TONE.GOOD);
    expect(card.getByText(DESIGN_SCHEDULE_CHIP)).toHaveAttribute('data-tone', EVM_TONE.NEUTRAL);
  });

  it('explains that there is nothing assigned when the user owns no activity', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPage();

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('registers progress from a card through the side panel and refetches', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: REGISTER_DESIGN }));

    const panel = screen.getByRole('dialog', { name: PANEL_TITLE });
    fireEvent.change(within(panel).getByLabelText(PROGRESS_FIELD), {
      target: { value: NEW_PROGRESS },
    });
    await userEvent.click(screen.getByRole('button', { name: SAVE }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(
      mockDb.activities.find((activity) => activity.id === SEED_IDS.ACTIVITY_DESIGN),
    ).toMatchObject({ actualProgressPercent: 60 });
  });
});

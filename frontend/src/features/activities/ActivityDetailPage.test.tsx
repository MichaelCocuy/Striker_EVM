import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { env } from '@/config/env';
import { activityDetailPath, projectDashboardPath, ROUTES } from '@/constants/routes';
import { NOT_COMPUTABLE } from '@/lib/format';
import { mockDb, resetMockDatabase } from '@/mocks/db';
import { evmReportFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { ActivityDetailPage } from './ActivityDetailPage';

import type { EvmActivityReport, EvmReport } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

const CARD_TITLE = {
  READING: 'Avance y costo a la fecha',
  INDICATORS: 'Todos los indicadores del reporte',
} as const;

const BUTTON = {
  REGISTER: 'Registrar avance',
  EDIT: 'Editar',
  DELETE: 'Eliminar',
  SAVE_PROGRESS: 'Guardar avance',
} as const;

/** Reading of the "Desarrollo" activity of docs/api/fixtures/evm-report.json. */
const DEVELOPMENT = {
  NAME: 'Desarrollo',
  OWNER_LINE: 'Responsable: Ana Registradora · BAC 40.000,00',
  PLANNED_VALUE: '20.000,00',
  EARNED_VALUE: '16.000,00',
  ESTIMATE: '50.000,00',
  COST_VARIANCE: '-4.000,00',
  SCHEDULE_VARIANCE: '-4.000,00',
  VARIANCE_AT_COMPLETION: '-10.000,00',
  ALERT_TITLE: 'Esta actividad terminará por encima de su presupuesto',
  ALERT_BODY:
    'Con CPI 0,8000 y SPI 0,8000, terminará en 50.000,00: 10.000,00 por encima de su presupuesto de 40.000,00.',
} as const;

const BACK_LABEL = 'Volver al tablero';
const DASHBOARD_MARKER = 'Tablero del proyecto';
const PROGRESS_FIELD = 'Avance real (%)';
const NEW_PROGRESS = '70';

const EVM_PATTERN = `*${env.apiBaseUrl}${API_PATHS.PROJECTS}/:projectId/evm`;

/** An activity whose indicators are not computable, as EVM_GUIA §5 describes. */
const notApplicableActivity: EvmActivityReport = {
  id: 'activity-not-applicable',
  name: 'Sin iniciar',
  owner: { id: SEED_IDS.REGISTRAR, fullName: 'Carlos Registrador' },
  input: {
    budgetAtCompletion: 1000,
    plannedProgressPercent: 0,
    actualProgressPercent: 0,
    actualCost: 0,
  },
  indicators: {
    budgetAtCompletion: 1000,
    plannedValue: 0,
    earnedValue: 0,
    actualCost: 0,
    costVariance: 0,
    scheduleVariance: 0,
    costPerformanceIndex: null,
    schedulePerformanceIndex: null,
    estimateAtCompletion: null,
    varianceAtCompletion: null,
    costStatus: COST_STATUS.NOT_APPLICABLE,
    scheduleStatus: SCHEDULE_STATUS.NOT_APPLICABLE,
    notes: ['CPI no calculable: AC = 0'],
  },
};

const routes: RouteObject[] = [
  { path: ROUTES.ACTIVITY_DETAIL, element: <ActivityDetailPage /> },
  { path: ROUTES.PROJECT_DASHBOARD, element: <p>{DASHBOARD_MARKER}</p> },
];

function renderDetail(activityId: string) {
  return renderWithRouter({
    routes,
    initialPath: activityDetailPath(SEED_IDS.PROJECT, activityId),
  });
}

function cardOf(title: string): HTMLElement {
  const section = screen.getByRole('heading', { name: title }).closest('section');
  if (section === null) {
    throw new Error(`There is no card titled ${title}`);
  }
  return section;
}

async function findReadingCard(): Promise<HTMLElement> {
  await screen.findByRole('heading', { name: CARD_TITLE.READING });
  return cardOf(CARD_TITLE.READING);
}

function reportWith(activity: EvmActivityReport): EvmReport {
  return { ...evmReportFixture, activities: [activity] };
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ActivityDetailPage', () => {
  it('names the activity with its owner and its budget, and shows the four reported figures', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    expect(await screen.findByRole('heading', { name: DEVELOPMENT.NAME })).toBeInTheDocument();
    expect(screen.getByText(DEVELOPMENT.OWNER_LINE)).toBeInTheDocument();

    const reading = within(await findReadingCard());
    expect(reading.getByText(DEVELOPMENT.EARNED_VALUE)).toBeInTheDocument();
    expect(reading.getByText(DEVELOPMENT.ESTIMATE)).toBeInTheDocument();
    /** PV and AC are both 20.000,00 for this activity. */
    expect(reading.getAllByText(DEVELOPMENT.PLANNED_VALUE)).toHaveLength(2);
    expect(reading.getByText('Avance planificado 50%')).toBeInTheDocument();
    expect(reading.getByText('Avance real 40%')).toBeInTheDocument();
  });

  it('explains with the reported numbers that the activity will end over its budget', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    const reading = within(await findReadingCard());
    expect(reading.getByText(DEVELOPMENT.ALERT_TITLE)).toBeInTheDocument();
    expect(reading.getByText(DEVELOPMENT.ALERT_BODY)).toBeInTheDocument();
  });

  it('does not alert about an activity the report says is under budget', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderDetail(SEED_IDS.ACTIVITY_DESIGN);

    await findReadingCard();
    expect(screen.queryByText(DEVELOPMENT.ALERT_TITLE)).toBeNull();
  });

  it('carries the indicators the table dropped, which is what the row sends the reader here for', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    await findReadingCard();
    const indicators = within(cardOf(CARD_TITLE.INDICATORS));
    expect(indicators.getAllByText(DEVELOPMENT.COST_VARIANCE)).toHaveLength(2);
    expect(indicators.getByText(DEVELOPMENT.VARIANCE_AT_COMPLETION)).toBeInTheDocument();
    /** The traffic light reads as text twice: as the activity's pill and next to its index. */
    expect(indicators.getAllByText('Sobre presupuesto')).toHaveLength(2);
    expect(indicators.getAllByText('Atrasado')).toHaveLength(2);
  });

  it('renders every indicator that is not computable as an em dash, never as zero', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    mockServer.use(
      http.get(EVM_PATTERN, () => HttpResponse.json(reportWith(notApplicableActivity))),
    );
    renderDetail(notApplicableActivity.id);

    const reading = within(await findReadingCard());
    /** Only the EAC tile is not computable; PV, EV and AC are a reported zero. */
    expect(reading.getAllByText(NOT_COMPUTABLE)).toHaveLength(1);

    const indicators = within(cardOf(CARD_TITLE.INDICATORS));
    expect(indicators.getAllByText(NOT_COMPUTABLE)).toHaveLength(4);
    expect(indicators.getByText('CPI no calculable: AC = 0')).toBeInTheDocument();
  });

  it('offers no action on an activity the registrar does not own', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    const reading = within(await findReadingCard());
    expect(reading.queryByRole('button')).toBeNull();
  });

  it('offers the three actions on an activity the registrar owns', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderDetail(SEED_IDS.ACTIVITY_DESIGN);

    const reading = within(await findReadingCard());
    expect(reading.getByRole('button', { name: BUTTON.REGISTER })).toBeInTheDocument();
    expect(reading.getByRole('button', { name: BUTTON.EDIT })).toBeInTheDocument();
    expect(reading.getByRole('button', { name: BUTTON.DELETE })).toBeInTheDocument();
  });

  it('registers progress through the side panel and keeps the report as the source', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderDetail(SEED_IDS.ACTIVITY_DESIGN);

    const reading = within(await findReadingCard());
    await userEvent.click(reading.getByRole('button', { name: BUTTON.REGISTER }));

    const panel = screen.getByRole('dialog', { name: BUTTON.REGISTER });
    fireEvent.change(within(panel).getByLabelText(PROGRESS_FIELD), {
      target: { value: NEW_PROGRESS },
    });
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SAVE_PROGRESS }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(
      mockDb.activities.find((activity) => activity.id === SEED_IDS.ACTIVITY_DESIGN),
    ).toMatchObject({ actualProgressPercent: 70 });
  });

  it('asks for confirmation before deleting and then goes back to the dashboard', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { router } = renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    const reading = within(await findReadingCard());
    await userEvent.click(reading.getByRole('button', { name: BUTTON.DELETE }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Eliminar actividad' })).toBeInTheDocument();
    expect(mockDb.activities).toHaveLength(evmReportFixture.activities.length);

    await userEvent.click(within(dialog).getByRole('button', { name: BUTTON.DELETE }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(projectDashboardPath(SEED_IDS.PROJECT));
    });
    expect(mockDb.activities.map((activity) => activity.id)).not.toContain(
      SEED_IDS.ACTIVITY_DEVELOPMENT,
    );
  });

  it('leads back to the dashboard of the project', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderDetail(SEED_IDS.ACTIVITY_DEVELOPMENT);

    expect(screen.getByRole('link', { name: BACK_LABEL })).toHaveAttribute(
      'href',
      projectDashboardPath(SEED_IDS.PROJECT),
    );

    await userEvent.click(screen.getByRole('link', { name: BACK_LABEL }));
    expect(await screen.findByText(DASHBOARD_MARKER)).toBeInTheDocument();
  });
});

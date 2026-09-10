import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { ERROR_CODE } from '@/api/errors';
import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { activityDetailPath, projectDashboardPath, ROUTES } from '@/constants/routes';
import { EVM_TONE } from '@/evm/tone';
import { NOT_COMPUTABLE } from '@/lib/format';
import { mockDb, resetMockDatabase } from '@/mocks/db';
import { evmReportFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { ActivitiesTable } from './ActivitiesTable';
import { DEVIATION_DIRECTION } from './activity-deviation';
import { TABLE_INDICATORS } from './activity-indicators';

import type { EvmActivityReport } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

/** Attributes the row's graphics use to state their tone and their direction. */
const TONE_ATTRIBUTE = 'data-tone';
const DIRECTION_ATTRIBUTE = 'data-direction';

/** Hidden reading of the deviation glyph for each activity of the fixture. */
const DEVIATION_READING = {
  DESIGN: 'Igual al plan: avance real 100% frente al 100% planificado a la fecha de corte',
  DEVELOPMENT: 'Por debajo del plan: avance real 40% frente al 50% planificado a la fecha de corte',
  TESTING: 'Por encima del plan: avance real 30% frente al 20% planificado a la fecha de corte',
} as const;

/** Hidden reading of the progress bar, which is also where BAC and PV stay reachable. */
const PROGRESS_READING = {
  DEVELOPMENT:
    'Avance real 40% · Avance planificado 50% · Presupuesto total (BAC) 40.000,00 · Valor planificado (PV) 20.000,00',
  TESTING:
    'Avance real 30% · Avance planificado 20% · Presupuesto total (BAC) 10.000,00 · Valor planificado (PV) 2.000,00',
} as const;

const LABEL = {
  NAME: 'Nombre',
  BUDGET: /presupuesto total/i,
  PLANNED_PROGRESS: '% de avance planificado',
  ACTUAL_PROGRESS: '% de avance real',
  ACTUAL_COST: /costo real/i,
} as const;

const BUTTON = {
  CREATE: 'Nueva actividad',
  SUBMIT_CREATE: 'Crear actividad',
} as const;

const NEW_ACTIVITY = {
  NAME: 'Documentación',
  BUDGET: '5000',
  PLANNED_PROGRESS: '20',
  ACTUAL_PROGRESS: '10',
  ACTUAL_COST: '400',
} as const;

const SERVER_FIELD_MESSAGE = 'plannedProgressPercent must be between 0 and 100';

const ACTIVITIES_PATTERN = `*${env.apiBaseUrl}${API_PATHS.PROJECTS}/:projectId/activities`;

/** Stand-in for the activity detail, so navigation can be asserted without its page. */
const DETAIL_MARKER = 'Detalle de la actividad';

const DASHBOARD_PATH = projectDashboardPath(SEED_IDS.PROJECT);
const DEVELOPMENT_DETAIL_PATH = activityDetailPath(SEED_IDS.PROJECT, SEED_IDS.ACTIVITY_DEVELOPMENT);

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

interface RenderOptions {
  activities?: readonly EvmActivityReport[];
  isLoading?: boolean;
}

function renderTable({
  activities = evmReportFixture.activities,
  isLoading = false,
}: RenderOptions = {}) {
  const onDataChanged = vi.fn();
  const routes: RouteObject[] = [
    {
      path: ROUTES.PROJECT_DASHBOARD,
      element: (
        <ActivitiesTable
          projectId={SEED_IDS.PROJECT}
          activities={activities}
          isLoading={isLoading}
          onDataChanged={onDataChanged}
        />
      ),
    },
    { path: ROUTES.ACTIVITY_DETAIL, element: <p>{DETAIL_MARKER}</p> },
  ];
  const { router } = renderWithRouter({ routes, initialPath: DASHBOARD_PATH });
  return { onDataChanged, router };
}

function rowOf(activityName: string): HTMLElement {
  const header = screen.getByRole('rowheader', { name: new RegExp(activityName) });
  const row = header.closest('tr');
  if (row === null) {
    throw new Error(`The activity ${activityName} is not rendered inside a row`);
  }
  return row;
}

/**
 * Text of the indicator cells of a row, in the order of `TABLE_INDICATORS` and without the
 * label each cell repeats for the stacked layout.
 */
function indicatorTextsOf(activityName: string): string[] {
  const cells = within(rowOf(activityName)).getAllByRole('cell');
  return TABLE_INDICATORS.map((indicator) => {
    const cell = cells.find((candidate) => candidate.textContent?.startsWith(indicator.label));
    if (cell === undefined) {
      throw new Error(`The row of ${activityName} has no ${indicator.label} cell`);
    }
    return (cell.textContent ?? '').slice(indicator.label.length);
  });
}

function deviationGlyphOf(activityName: string, reading: string): HTMLElement {
  const glyph = within(rowOf(activityName)).getByText(reading).closest(`[${DIRECTION_ATTRIBUTE}]`);
  if (!(glyph instanceof HTMLElement)) {
    throw new Error(`The row of ${activityName} has no deviation glyph`);
  }
  return glyph;
}

async function fillNewActivityForm(dialog: HTMLElement): Promise<void> {
  await userEvent.type(within(dialog).getByLabelText(LABEL.NAME), NEW_ACTIVITY.NAME);
  await userEvent.type(within(dialog).getByLabelText(LABEL.BUDGET), NEW_ACTIVITY.BUDGET);
  await userEvent.type(
    within(dialog).getByLabelText(LABEL.PLANNED_PROGRESS),
    NEW_ACTIVITY.PLANNED_PROGRESS,
  );
  await userEvent.type(
    within(dialog).getByLabelText(LABEL.ACTUAL_PROGRESS),
    NEW_ACTIVITY.ACTUAL_PROGRESS,
  );
  await userEvent.type(within(dialog).getByLabelText(LABEL.ACTUAL_COST), NEW_ACTIVITY.ACTUAL_COST);
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ActivitiesTable', () => {
  it('lays the nine columns out as the redesigned row reads', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Actividad',
      'Desviación',
      'Avance',
      'EV',
      'AC',
      'CPI',
      'SPI',
      'EAC',
      'Detalle',
    ]);
  });

  it('renders one row per activity with its owner under the name', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(screen.getAllByRole('rowheader')).toHaveLength(evmReportFixture.activities.length);
    expect(within(rowOf('Desarrollo')).getByText('Ana Registradora')).toBeInTheDocument();
    expect(within(rowOf('Diseño')).getByText('Carlos Registrador')).toBeInTheDocument();
    expect(within(rowOf('Pruebas')).getByText('Carlos Registrador')).toBeInTheDocument();
  });

  it('shows the money and each index inside the chip of its traffic light', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    /** docs/api/fixtures/evm-report.json, presented with the precision of EVM_GUIA §7. */
    expect(indicatorTextsOf('Desarrollo')).toEqual([
      '16.000,00',
      '20.000,00',
      '0,8000Sobre presupuesto',
      '0,8000Atrasado',
      '50.000,00',
    ]);
    expect(indicatorTextsOf('Diseño')).toEqual([
      '10.000,00',
      '9.000,00',
      '1,1111Bajo presupuesto',
      '1,0000En cronograma',
      '9.000,00',
    ]);

    const behindRow = rowOf('Desarrollo');
    for (const chip of within(behindRow).getAllByText('0,8000')) {
      expect(chip).toHaveAttribute(TONE_ATTRIBUTE, EVM_TONE.BAD);
    }
    expect(within(rowOf('Pruebas')).getByText('1,2000')).toHaveAttribute(
      TONE_ATTRIBUTE,
      EVM_TONE.GOOD,
    );
  });

  it('stacks the real progress over the planned fill and keeps BAC and PV readable', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    const row = rowOf('Desarrollo');
    expect(within(row).getByText('40%')).toBeInTheDocument();
    /** BAC and PV have no column of their own: the bar carries them as text and as a tooltip. */
    expect(within(row).getByText(PROGRESS_READING.DEVELOPMENT)).toBeInTheDocument();
    expect(within(row).getByTitle(PROGRESS_READING.DEVELOPMENT)).toBeInTheDocument();
    expect(within(rowOf('Pruebas')).getByText(PROGRESS_READING.TESTING)).toBeInTheDocument();
  });

  it('says as text which side of the plan each activity is on', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(deviationGlyphOf('Desarrollo', DEVIATION_READING.DEVELOPMENT)).toHaveAttribute(
      DIRECTION_ATTRIBUTE,
      DEVIATION_DIRECTION.BELOW,
    );
    expect(deviationGlyphOf('Pruebas', DEVIATION_READING.TESTING)).toHaveAttribute(
      DIRECTION_ATTRIBUTE,
      DEVIATION_DIRECTION.ABOVE,
    );
    expect(deviationGlyphOf('Diseño', DEVIATION_READING.DESIGN)).toHaveAttribute(
      DIRECTION_ATTRIBUTE,
      DEVIATION_DIRECTION.ON_PLAN,
    );
  });

  it('renders an em dash in the no-aplica tone for indicators that are not computable', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable({ activities: [notApplicableActivity] });

    const row = rowOf('Sin iniciar');
    const notComputable = within(row).getAllByText(NOT_COMPUTABLE);
    expect(notComputable).toHaveLength(3);
    expect(notComputable.filter((element) => element.dataset.tone === EVM_TONE.NA)).toHaveLength(2);
    expect(within(row).getAllByText('No aplica')).toHaveLength(2);
    expect(within(row).getByText('CPI no calculable: AC = 0')).toBeInTheDocument();
  });

  it('shows skeletons instead of the table while the report loads', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable({ isLoading: true });

    expect(screen.queryByRole('table')).toBeNull();
  });

  it('links every activity name to its detail, so the row is reachable by keyboard', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(within(rowOf('Desarrollo')).getByRole('link', { name: 'Desarrollo' })).toHaveAttribute(
      'href',
      DEVELOPMENT_DETAIL_PATH,
    );
  });

  it('opens the activity detail when the row is clicked', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { router } = renderTable();

    await userEvent.click(rowOf('Desarrollo'));

    expect(await screen.findByText(DETAIL_MARKER)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(DEVELOPMENT_DETAIL_PATH);
  });

  it('pushes a single history entry when the name link itself is clicked', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { router } = renderTable();

    await userEvent.click(within(rowOf('Desarrollo')).getByRole('link', { name: 'Desarrollo' }));
    expect(router.state.location.pathname).toBe(DEVELOPMENT_DETAIL_PATH);

    /** The link and the row must not both navigate, or going back would take two steps. */
    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.pathname).toBe(DASHBOARD_PATH);
  });

  it('creates an activity and then asks the dashboard to refetch', async () => {
    const user = signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    const { onDataChanged } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: BUTTON.CREATE }));
    await fillNewActivityForm(screen.getByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_CREATE }));

    await waitFor(() => {
      expect(onDataChanged).toHaveBeenCalledTimes(1);
    });
    expect(mockDb.activities.at(-1)).toMatchObject({
      name: NEW_ACTIVITY.NAME,
      projectId: SEED_IDS.PROJECT,
      owner: { id: user.id },
      budgetAtCompletion: 5000,
      plannedProgressPercent: 20,
      actualProgressPercent: 10,
      actualCost: 400,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows a server validation error on its field and keeps what was typed', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    mockServer.use(
      http.post(ACTIVITIES_PATTERN, () =>
        HttpResponse.json(
          {
            code: ERROR_CODE.VALIDATION_ERROR,
            message: 'La solicitud contiene campos inválidos',
            details: [{ field: 'plannedProgressPercent', message: SERVER_FIELD_MESSAGE }],
          },
          { status: HTTP_STATUS.BAD_REQUEST },
        ),
      ),
    );
    const { onDataChanged } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: BUTTON.CREATE }));
    const dialog = screen.getByRole('dialog');
    await fillNewActivityForm(dialog);
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_CREATE }));

    const plannedInput = await within(dialog).findByLabelText(LABEL.PLANNED_PROGRESS);
    const messageId = plannedInput.getAttribute('aria-describedby');
    expect(plannedInput).toHaveAttribute('aria-invalid', 'true');
    expect(messageId === null ? null : document.getElementById(messageId)).toHaveTextContent(
      SERVER_FIELD_MESSAGE,
    );
    expect(within(dialog).getByLabelText(LABEL.NAME)).toHaveValue(NEW_ACTIVITY.NAME);
    expect(onDataChanged).not.toHaveBeenCalled();
  });

  it('keeps editing and deleting out of the row, where the detail now owns them', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(within(rowOf('Diseño')).queryByRole('button')).toBeNull();
  });
});

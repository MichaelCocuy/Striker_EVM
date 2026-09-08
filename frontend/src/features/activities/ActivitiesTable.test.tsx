import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { ERROR_CODE } from '@/api/errors';
import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { NOT_COMPUTABLE } from '@/lib/format';
import { mockDb, resetMockDatabase } from '@/mocks/db';
import { evmReportFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { ActivitiesTable } from './ActivitiesTable';

import type { EvmActivityReport } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

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
  CONFIRM_DELETE: 'Eliminar',
  EDIT_DESIGN: 'Editar Diseño',
  EDIT_DEVELOPMENT: 'Editar Desarrollo',
  DELETE_DESIGN: 'Eliminar Diseño',
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
      path: '/',
      element: (
        <ActivitiesTable
          projectId={SEED_IDS.PROJECT}
          activities={activities}
          isLoading={isLoading}
          onDataChanged={onDataChanged}
        />
      ),
    },
  ];
  renderWithRouter({ routes, initialPath: '/' });
  return { onDataChanged };
}

function rowOf(activityName: string): HTMLElement {
  const header = screen.getByRole('rowheader', { name: new RegExp(activityName) });
  const row = header.closest('tr');
  if (row === null) {
    throw new Error(`The activity ${activityName} is not rendered inside a row`);
  }
  return row;
}

function cellTextsOf(activityName: string): (string | null)[] {
  return within(rowOf(activityName))
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
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
  it('renders one row per activity with the numbers the report brings', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(screen.getAllByRole('rowheader')).toHaveLength(evmReportFixture.activities.length);
    /** docs/api/fixtures/evm-report.json, presented with the precision of EVM_GUIA §7. */
    expect(cellTextsOf('Desarrollo').slice(0, 10)).toEqual([
      'Ana Registradora',
      '50%',
      '40%',
      '40.000,00',
      '20.000,00',
      '16.000,00',
      '20.000,00',
      '0,8000',
      '0,8000',
      '50.000,00',
    ]);
    expect(cellTextsOf('Diseño').slice(3, 10)).toEqual([
      '10.000,00',
      '10.000,00',
      '10.000,00',
      '9.000,00',
      '1,1111',
      '1,0000',
      '9.000,00',
    ]);
  });

  it('shows the consolidated traffic light of each activity', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    const row = rowOf('Desarrollo');
    expect(within(row).getByText('Sobre presupuesto')).toBeInTheDocument();
    expect(within(row).getByText('Atrasado')).toBeInTheDocument();
  });

  it('renders an em dash for indicators that are not computable', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable({ activities: [notApplicableActivity] });

    const row = rowOf('Sin iniciar');
    expect(within(row).getAllByText(NOT_COMPUTABLE)).toHaveLength(3);
    expect(within(row).getAllByText('No aplica')).toHaveLength(2);
    expect(within(row).getByText('CPI no calculable: AC = 0')).toBeInTheDocument();
  });

  it('shows skeletons instead of the table while the report loads', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable({ isLoading: true });

    expect(screen.queryByRole('table')).toBeNull();
  });

  it('hides the edit action of an activity the registrar does not own', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    renderTable();

    expect(screen.getByRole('button', { name: BUTTON.EDIT_DESIGN })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BUTTON.EDIT_DEVELOPMENT })).toBeNull();
  });

  it('lets a reviewer edit and delete any activity', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderTable();

    expect(screen.getByRole('button', { name: BUTTON.EDIT_DEVELOPMENT })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BUTTON.DELETE_DESIGN })).toBeInTheDocument();
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

  it('asks for confirmation before deleting an activity', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onDataChanged } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: BUTTON.DELETE_DESIGN }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Eliminar actividad' })).toBeInTheDocument();
    expect(within(dialog).getByText('Diseño')).toBeInTheDocument();
    expect(mockDb.activities).toHaveLength(evmReportFixture.activities.length);
    expect(onDataChanged).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: BUTTON.CONFIRM_DELETE }));

    await waitFor(() => {
      expect(onDataChanged).toHaveBeenCalledTimes(1);
    });
    expect(mockDb.activities.map((activity) => activity.id)).not.toContain(
      SEED_IDS.ACTIVITY_DESIGN,
    );
  });
});

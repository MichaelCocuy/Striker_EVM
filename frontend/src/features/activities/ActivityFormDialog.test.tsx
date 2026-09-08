import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb, resetMockDatabase } from '@/mocks/db';
import { evmReportFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { ACTIVITY_FORM_MESSAGES } from './activity-form';
import { ActivityFormDialog } from './ActivityFormDialog';

import type { EvmActivityReport } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

const LABEL = {
  NAME: 'Nombre',
  OWNER: 'Responsable',
  BUDGET: /presupuesto total/i,
  PLANNED_PROGRESS: '% de avance planificado',
  ACTUAL_PROGRESS: '% de avance real',
  ACTUAL_COST: /costo real/i,
} as const;

const BUTTON = {
  SUBMIT_CREATE: 'Crear actividad',
  SUBMIT_EDIT: 'Guardar cambios',
} as const;

const OTHER_REGISTRAR_OPTION = /Ana Registradora/;
const NEW_NAME = 'Capacitación';
const NEW_COST = '9500';

function designActivity(): EvmActivityReport {
  const activity = evmReportFixture.activities.find(
    (candidate) => candidate.id === SEED_IDS.ACTIVITY_DESIGN,
  );
  if (activity === undefined) {
    throw new Error('The fixture no longer contains the "Diseño" activity');
  }
  return activity;
}

interface RenderOptions {
  activity?: EvmActivityReport;
}

function renderDialog({ activity }: RenderOptions = {}) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  const routes: RouteObject[] = [
    {
      path: '/',
      element: (
        <ActivityFormDialog
          projectId={SEED_IDS.PROJECT}
          {...(activity ? { activity } : {})}
          onClose={onClose}
          onSaved={onSaved}
        />
      ),
    },
  ];
  renderWithRouter({ routes, initialPath: '/' });
  return { onSaved, onClose };
}

async function fillMeasures(): Promise<void> {
  await userEvent.type(screen.getByLabelText(LABEL.NAME), NEW_NAME);
  await userEvent.type(screen.getByLabelText(LABEL.BUDGET), '8000');
  await userEvent.type(screen.getByLabelText(LABEL.PLANNED_PROGRESS), '25');
  await userEvent.type(screen.getByLabelText(LABEL.ACTUAL_PROGRESS), '25');
  await userEvent.type(screen.getByLabelText(LABEL.ACTUAL_COST), '2000');
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ActivityFormDialog', () => {
  it('asks a reviewer to choose the owner and sends the selected id', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onSaved } = renderDialog();

    await screen.findByRole('option', { name: OTHER_REGISTRAR_OPTION });
    await userEvent.selectOptions(screen.getByLabelText(LABEL.OWNER), SEED_IDS.REGISTRAR_2);
    await fillMeasures();
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_CREATE }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(mockDb.activities.at(-1)).toMatchObject({
      name: NEW_NAME,
      owner: { id: SEED_IDS.REGISTRAR_2 },
    });
  });

  it('does not offer the owner field to a registrar, who is always the owner', async () => {
    const user = signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    const { onSaved } = renderDialog();

    expect(screen.queryByLabelText(LABEL.OWNER)).toBeNull();

    await fillMeasures();
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_CREATE }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(mockDb.activities.at(-1)).toMatchObject({ owner: { id: user.id } });
  });

  it('blocks the submit while a field is invalid', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    const { onSaved } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_CREATE }));

    expect(screen.getByText(ACTIVITY_FORM_MESSAGES.NAME_REQUIRED)).toBeInTheDocument();
    expect(screen.getAllByText(ACTIVITY_FORM_MESSAGES.NUMBER_INVALID)).toHaveLength(4);
    expect(onSaved).not.toHaveBeenCalled();
    expect(mockDb.activities).toHaveLength(evmReportFixture.activities.length);
  });

  it('pre-fills the activity being edited and saves the new measures', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    const { onSaved } = renderDialog({ activity: designActivity() });

    expect(screen.getByLabelText(LABEL.NAME)).toHaveValue('Diseño');
    expect(screen.getByLabelText(LABEL.BUDGET)).toHaveValue('10000');

    await userEvent.clear(screen.getByLabelText(LABEL.ACTUAL_COST));
    await userEvent.type(screen.getByLabelText(LABEL.ACTUAL_COST), NEW_COST);
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SUBMIT_EDIT }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(
      mockDb.activities.find((activity) => activity.id === SEED_IDS.ACTIVITY_DESIGN),
    ).toMatchObject({ actualCost: 9500 });
  });
});

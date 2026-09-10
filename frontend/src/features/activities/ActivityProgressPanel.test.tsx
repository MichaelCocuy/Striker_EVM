import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { ERROR_CODE } from '@/api/errors';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { EVM_TONE } from '@/evm/tone';
import { mockDb, resetMockDatabase } from '@/mocks/db';
import { evmReportFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { SEED_USER_EMAIL, renderWithRouter, signInAsSeedUser } from '@/test/render';

import { ACTIVITY_FORM_MESSAGES } from './activity-form';
import { ActivityProgressPanel } from './ActivityProgressPanel';

import type { EvmActivityReport } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

const PROJECT_NAME = 'Portal de clientes';

const LABEL = {
  PROGRESS: 'Avance real (%)',
  COST: 'Costo real acumulado (AC)',
  CLOSE: 'Cerrar',
} as const;

const BUTTON = {
  SAVE: 'Guardar avance',
  CANCEL: 'Cancelar',
  OPEN: 'Abrir el panel',
} as const;

const PANEL_TITLE = 'Registrar avance';

/** Reading of the "Desarrollo" activity of docs/api/fixtures/evm-report.json. */
const DEVELOPMENT = {
  CONTEXT_HINT: 'Dinero ya gastado en la actividad. Presupuesto total: 40.000,00',
  PLANNED_TO_DATE: 'Planificado a la fecha: 50%',
  EARNED_VALUE: '16.000,00',
  COST_INDEX: '0,8000',
  ESTIMATE: '50.000,00',
} as const;

const READING = {
  BEHIND: 'Con este avance la actividad queda por detrás del plan a la fecha de corte.',
  AHEAD: 'Con este avance la actividad queda por delante del plan a la fecha de corte.',
  NO_ESTIMATE: 'esta previsualización no los estima',
} as const;

const CURRENT_READING = 'Lectura actual del reporte';
const NEW_PROGRESS = '80';
const INVALID_COST = 'mil pesos';

const ACTIVITY_PATTERN = `*${env.apiBaseUrl}${API_PATHS.PROJECTS}/:projectId/activities/:activityId`;

function developmentActivity(): EvmActivityReport {
  const activity = evmReportFixture.activities.find(
    (candidate) => candidate.id === SEED_IDS.ACTIVITY_DEVELOPMENT,
  );
  if (activity === undefined) {
    throw new Error('The fixture no longer contains the "Desarrollo" activity');
  }
  return activity;
}

function renderPanel() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const routes: RouteObject[] = [
    {
      path: '/',
      element: (
        <ActivityProgressPanel
          projectId={SEED_IDS.PROJECT}
          projectName={PROJECT_NAME}
          activity={developmentActivity()}
          onClose={onClose}
          onSaved={onSaved}
        />
      ),
    },
  ];
  renderWithRouter({ routes, initialPath: '/' });
  return { onClose, onSaved };
}

/** Harness with an opener, to check that focus is taken and given back. */
function PanelOpener() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        {BUTTON.OPEN}
      </button>
      {isOpen && (
        <ActivityProgressPanel
          projectId={SEED_IDS.PROJECT}
          projectName={PROJECT_NAME}
          activity={developmentActivity()}
          onClose={() => setIsOpen(false)}
          onSaved={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function renderOpener() {
  renderWithRouter({ routes: [{ path: '/', element: <PanelOpener /> }], initialPath: '/' });
}

function panel(): HTMLElement {
  return screen.getByRole('dialog', { name: PANEL_TITLE });
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ActivityProgressPanel', () => {
  it('says what is being registered and what the plan says at the cut-off date', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPanel();

    const inside = within(panel());
    expect(inside.getByText(`${PROJECT_NAME} · Desarrollo`)).toBeInTheDocument();
    expect(inside.getByText(DEVELOPMENT.PLANNED_TO_DATE)).toBeInTheDocument();
    expect(inside.getByText(DEVELOPMENT.CONTEXT_HINT)).toBeInTheDocument();
    /** The slider starts at the stored real progress, and the figure next to it repeats it. */
    expect(inside.getByLabelText(LABEL.PROGRESS)).toBeInTheDocument();
    expect(inside.getByText('40')).toBeInTheDocument();
    expect(inside.getByLabelText(LABEL.COST)).toHaveValue('20000');
  });

  it('previews the plan against the draft without estimating a single indicator', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPanel();

    const inside = within(panel());
    expect(inside.getByText(READING.BEHIND, { exact: false })).toBeInTheDocument();
    expect(inside.getByText(READING.NO_ESTIMATE, { exact: false })).toBeInTheDocument();

    /** The tiles are the last calculation of the server, stated as such. */
    expect(inside.getByText(CURRENT_READING)).toBeInTheDocument();
    expect(inside.getByText(DEVELOPMENT.EARNED_VALUE)).toBeInTheDocument();
    expect(inside.getByText(DEVELOPMENT.ESTIMATE)).toBeInTheDocument();
    for (const figure of inside.getAllByText(DEVELOPMENT.COST_INDEX)) {
      expect(figure).toHaveAttribute('data-tone', EVM_TONE.BAD);
    }
  });

  it('follows the slider with the drafted percentage and its reading', () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPanel();

    fireEvent.change(within(panel()).getByLabelText(LABEL.PROGRESS), {
      target: { value: NEW_PROGRESS },
    });

    const inside = within(panel());
    expect(inside.getByText(NEW_PROGRESS)).toBeInTheDocument();
    expect(inside.getByText(READING.AHEAD, { exact: false })).toBeInTheDocument();
    /** The indicators of the report do not move: only the server recalculates them. */
    expect(inside.getByText(DEVELOPMENT.EARNED_VALUE)).toBeInTheDocument();
  });

  it('stays open while the panel itself is used, because the backdrop is its sibling', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onClose } = renderPanel();

    const sheet = panel();
    fireEvent.change(within(sheet).getByLabelText(LABEL.PROGRESS), { target: { value: '55' } });
    await userEvent.click(within(sheet).getByText(CURRENT_READING));
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = sheet.previousElementSibling;
    expect(backdrop).not.toBeNull();
    if (backdrop instanceof HTMLElement) {
      await userEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with the close button, with Cancelar and with Escape', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onClose } = renderPanel();

    await userEvent.click(within(panel()).getByLabelText(LABEL.CLOSE));
    await userEvent.click(screen.getByRole('button', { name: BUTTON.CANCEL }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('takes focus when it opens and gives it back to the opener when it closes', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderOpener();

    const opener = screen.getByRole('button', { name: BUTTON.OPEN });
    await userEvent.click(opener);
    expect(panel()).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(opener).toHaveFocus();
  });

  it('keeps Tab inside the panel while it is open', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    renderPanel();

    const sheet = panel();
    const save = screen.getByRole('button', { name: BUTTON.SAVE });
    save.focus();
    await userEvent.tab();

    expect(sheet.contains(document.activeElement)).toBe(true);
  });

  it('saves the two raw numbers and reports back so the report is refetched', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onSaved } = renderPanel();

    fireEvent.change(within(panel()).getByLabelText(LABEL.PROGRESS), {
      target: { value: NEW_PROGRESS },
    });
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SAVE }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(
      mockDb.activities.find((activity) => activity.id === SEED_IDS.ACTIVITY_DEVELOPMENT),
    ).toMatchObject({
      name: 'Desarrollo',
      budgetAtCompletion: 40000,
      plannedProgressPercent: 50,
      actualProgressPercent: 80,
      actualCost: 20000,
    });
  });

  it('validates the cost before sending anything', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REVIEWER);
    const { onSaved } = renderPanel();

    const cost = within(panel()).getByLabelText(LABEL.COST);
    await userEvent.clear(cost);
    await userEvent.type(cost, INVALID_COST);
    await userEvent.click(screen.getByRole('button', { name: BUTTON.SAVE }));

    expect(screen.getByText(ACTIVITY_FORM_MESSAGES.NUMBER_INVALID)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('translates a 403 into the sentence the permission matrix deserves', async () => {
    signInAsSeedUser(SEED_USER_EMAIL.REGISTRAR);
    mockServer.use(
      http.put(ACTIVITY_PATTERN, () =>
        HttpResponse.json(
          {
            code: ERROR_CODE.FORBIDDEN,
            message: 'REGISTRAR users can only modify their own activities',
            details: [],
          },
          { status: HTTP_STATUS.FORBIDDEN },
        ),
      ),
    );
    const { onSaved } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: BUTTON.SAVE }));

    expect(await screen.findByRole('alert')).toHaveTextContent(ACTIVITY_FORM_MESSAGES.FORBIDDEN);
    expect(onSaved).not.toHaveBeenCalled();
  });
});

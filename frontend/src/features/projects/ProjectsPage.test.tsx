import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { COST_STATUS, ERROR_CODE, ROLES, SCHEDULE_STATUS } from '@/api/types';
import { appRoutes } from '@/app/router';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { projectDashboardPath, ROUTES } from '@/constants/routes';
import { formatIndex } from '@/lib/format';
import { resetMockDatabase } from '@/mocks/db';
import { evmReportFixture, projectFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { renderWithRouter, signInAs } from '@/test/render';

import { PORTFOLIO_COPY } from './portfolio-copy';
import { PROJECT_FORM_MESSAGES, PROJECT_NAME_MAX_LENGTH } from './project-form';
import { ProjectsPage } from './ProjectsPage';

import type {
  ApiErrorBody,
  CostStatus,
  EvmReport,
  Project,
  Role,
  ScheduleStatus,
} from '@/api/types';
import type { RouteObject } from 'react-router-dom';

/** docs/api/fixtures: the seeded project and the report the portfolio must show for it. */
const SEED_PROJECT_NAME = 'Portal de clientes';
const SEED_ACTIVITY_COUNT_LABEL = '3 actividades';
const SEED_COST_STATUS_LABEL = 'Sobre presupuesto';
const SEED_SCHEDULE_STATUS_LABEL = 'Atrasado';
const STATUS_UNAVAILABLE_LABEL = PORTFOLIO_COPY.LIST.STATUS_UNAVAILABLE;
const NOT_COMPUTABLE_MARK = '—';

const DASHBOARD_TEXT = 'Dashboard del proyecto';
const NEW_PROJECT_NAME = 'Migración de facturación';
const NEW_PROJECT_DESCRIPTION = 'Reemplazo del facturador actual.';
const SERVER_NAME_MESSAGE = 'El nombre ya está en uso';

const NEW_PROJECT_ACTION = /nuevo proyecto/i;
const NAME_LABEL = /nombre/i;
const DESCRIPTION_LABEL = /descripción/i;
const CREATE_SUBMIT = /crear proyecto/i;
const SAVE_SUBMIT = /guardar cambios/i;
const CANCEL_ACTION = /cancelar/i;
const CONFIRM_DELETE_ACTION = /eliminar proyecto/i;
const EMPTY_TITLE = /todavía no hay proyectos/i;
const CASCADE_WARNING = /no se puede deshacer/i;

const portfolioRoutes: RouteObject[] = [
  { path: ROUTES.PROJECTS, element: <ProjectsPage /> },
  { path: ROUTES.PROJECT_DASHBOARD, element: <p>{DASHBOARD_TEXT}</p> },
];

/** MSW matches any origin, like the shared handlers do. */
function apiPattern(path: string): string {
  return `*${env.apiBaseUrl}${path}`;
}

/** Signs in as a seed user of that role, then renders the portfolio route. */
function renderPortfolio(role: Role) {
  signInAs(role);
  return renderWithRouter({ routes: portfolioRoutes, initialPath: ROUTES.PROJECTS });
}

function errorBody(code: ApiErrorBody['code'], message: string, field?: string): ApiErrorBody {
  return { code, message, details: field === undefined ? [] : [{ field, message }] };
}

function emptyProjectList() {
  return http.get(apiPattern(API_PATHS.PROJECTS), () => HttpResponse.json<Project[]>([]));
}

async function findSeedProjectLink(): Promise<HTMLElement> {
  return screen.findByRole('link', { name: SEED_PROJECT_NAME });
}

/** The row (`article`) the project's link belongs to, so a figure can be read in context. */
function rowOf(projectName: string): HTMLElement {
  const row = screen.getByRole('link', { name: projectName }).closest('article');
  if (row === null) {
    throw new Error(`There is no portfolio row for ${projectName}`);
  }
  return row;
}

/**
 * The eight demo projects of backend/db/init.sql with the consolidated report the backend
 * computes for each of them, so the portfolio can be checked against real figures: the
 * documented case (01), the misleading CPI of 06 and the project without activities (08).
 */
const PROJECT_ID_PREFIX = '22222222-2222-4222-8222-00000000000';

interface SeededProject {
  position: number;
  name: string;
  activityCount: number;
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number | null;
  spi: number | null;
  eac: number | null;
  vac: number | null;
  cost: CostStatus;
  schedule: ScheduleStatus;
}

const SEEDED_PROJECTS: readonly SeededProject[] = [
  {
    position: 1,
    name: SEED_PROJECT_NAME,
    activityCount: 3,
    bac: 60000,
    pv: 32000,
    ev: 29000,
    ac: 31500,
    cv: -2500,
    sv: -3000,
    cpi: 0.9206,
    spi: 0.9063,
    eac: 65172.41,
    vac: -5172.41,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    position: 2,
    name: 'Migración a la nube',
    activityCount: 3,
    bac: 40000,
    pv: 23000,
    ev: 25600,
    ac: 22000,
    cv: 3600,
    sv: 2600,
    cpi: 1.1636,
    spi: 1.113,
    eac: 34375,
    vac: 5625,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
  },
  {
    position: 3,
    name: 'Integración de pagos',
    activityCount: 3,
    bac: 50000,
    pv: 17500,
    ev: 22750,
    ac: 29500,
    cv: -6750,
    sv: 5250,
    cpi: 0.7712,
    spi: 1.3,
    eac: 64835.16,
    vac: -14835.16,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
  },
  {
    position: 4,
    name: 'Rediseño del intranet',
    activityCount: 3,
    bac: 30000,
    pv: 17000,
    ev: 12500,
    ac: 10300,
    cv: 2200,
    sv: -4500,
    cpi: 1.2136,
    spi: 0.7353,
    eac: 24720,
    vac: 5280,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    position: 5,
    name: 'Cumplimiento normativo',
    activityCount: 3,
    bac: 40000,
    pv: 23000,
    ev: 23000,
    ac: 23000,
    cv: 0,
    sv: 0,
    cpi: 1,
    spi: 1,
    eac: 40000,
    vac: 0,
    cost: COST_STATUS.ON_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
  },
  {
    position: 6,
    name: 'App móvil de campo',
    activityCount: 4,
    bac: 43000,
    pv: 8400,
    ev: 2900,
    ac: 1600,
    cv: 1300,
    sv: -5500,
    cpi: 1.8125,
    spi: 0.3452,
    eac: 23724.14,
    vac: 19275.86,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    position: 7,
    name: 'Certificación ISO 27001',
    activityCount: 3,
    bac: 50000,
    pv: 50000,
    ev: 50000,
    ac: 56000,
    cv: -6000,
    sv: 0,
    cpi: 0.8929,
    spi: 1,
    eac: 56000,
    vac: -6000,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
  },
  {
    position: 8,
    name: 'Tablero de indicadores',
    activityCount: 0,
    bac: 0,
    pv: 0,
    ev: 0,
    ac: 0,
    cv: 0,
    sv: 0,
    cpi: null,
    spi: null,
    eac: null,
    vac: null,
    cost: COST_STATUS.NOT_APPLICABLE,
    schedule: SCHEDULE_STATUS.NOT_APPLICABLE,
  },
];

function seededId(seeded: SeededProject): string {
  return `${PROJECT_ID_PREFIX}${String(seeded.position)}`;
}

function seededProjectPayload(seeded: SeededProject): Project {
  return {
    ...projectFixture,
    id: seededId(seeded),
    name: seeded.name,
    description: null,
    activityCount: seeded.activityCount,
  };
}

function seededReportPayload(seeded: SeededProject): EvmReport {
  return {
    project: {
      id: seededId(seeded),
      name: seeded.name,
      indicators: {
        budgetAtCompletion: seeded.bac,
        plannedValue: seeded.pv,
        earnedValue: seeded.ev,
        actualCost: seeded.ac,
        costVariance: seeded.cv,
        scheduleVariance: seeded.sv,
        costPerformanceIndex: seeded.cpi,
        schedulePerformanceIndex: seeded.spi,
        estimateAtCompletion: seeded.eac,
        varianceAtCompletion: seeded.vac,
        costStatus: seeded.cost,
        scheduleStatus: seeded.schedule,
        notes: [],
      },
    },
    activities: [],
    generatedAt: evmReportFixture.generatedAt,
  };
}

/** Serves the eight demo projects; the report of `failingProjectId` answers 500 instead. */
function seededPortfolioHandlers(failingProjectId?: string) {
  return [
    http.get(apiPattern(API_PATHS.PROJECTS), () =>
      HttpResponse.json<Project[]>(SEEDED_PROJECTS.map(seededProjectPayload)),
    ),
    http.get(apiPattern(`${API_PATHS.PROJECTS}/:projectId/evm`), ({ params }) => {
      const seeded = SEEDED_PROJECTS.find((candidate) => seededId(candidate) === params.projectId);
      if (seeded === undefined || seededId(seeded) === failingProjectId) {
        return HttpResponse.json(errorBody(ERROR_CODE.INTERNAL_ERROR, 'reporte caído'), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }
      return HttpResponse.json<EvmReport>(seededReportPayload(seeded));
    }),
  ];
}

async function renderSeededPortfolio(failingProjectId?: string) {
  mockServer.use(...seededPortfolioHandlers(failingProjectId));
  const view = renderPortfolio(ROLES.REVIEWER);
  await findSeedProjectLink();
  return view;
}

function kpiStrip(): HTMLElement {
  return screen.getByRole('list', { name: PORTFOLIO_COPY.KPI.LABEL });
}

function quadrant(): HTMLElement {
  return screen.getByRole('img', { name: PORTFOLIO_COPY.QUADRANT.CHART_LABEL });
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('ProjectsPage portfolio', () => {
  it('lists the seeded project with its activity count and consolidated status', async () => {
    renderPortfolio(ROLES.REVIEWER);

    expect(await findSeedProjectLink()).toHaveAttribute(
      'href',
      projectDashboardPath(SEED_IDS.PROJECT),
    );
    expect(
      screen.getByRole('heading', { level: 1, name: PORTFOLIO_COPY.PAGE_TITLE }),
    ).toBeInTheDocument();

    const row = rowOf(SEED_PROJECT_NAME);
    expect(within(row).getByText(SEED_ACTIVITY_COUNT_LABEL)).toBeInTheDocument();
    expect(within(row).getByText(SEED_COST_STATUS_LABEL)).toBeInTheDocument();
    expect(within(row).getByText(SEED_SCHEDULE_STATUS_LABEL)).toBeInTheDocument();
    expect(
      within(row).getByText(formatIndex(evmReportFixture.project.indicators.costPerformanceIndex)),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(
        formatIndex(evmReportFixture.project.indicators.schedulePerformanceIndex),
      ),
    ).toBeInTheDocument();
  });

  it('opens the dashboard of the clicked project', async () => {
    const user = userEvent.setup();
    const { router } = renderPortfolio(ROLES.REVIEWER);

    await user.click(await findSeedProjectLink());

    expect(router.state.location.pathname).toBe(projectDashboardPath(SEED_IDS.PROJECT));
    expect(screen.getByText(DASHBOARD_TEXT)).toBeInTheDocument();
  });

  it('keeps a project whose report failed, with an unknown status', async () => {
    mockServer.use(
      http.get(apiPattern(API_PATHS.evm(SEED_IDS.PROJECT)), () =>
        HttpResponse.json(errorBody(ERROR_CODE.INTERNAL_ERROR, 'boom'), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        }),
      ),
    );
    renderPortfolio(ROLES.REVIEWER);

    expect(await findSeedProjectLink()).toBeInTheDocument();
    const row = rowOf(SEED_PROJECT_NAME);
    expect(within(row).getByText(STATUS_UNAVAILABLE_LABEL)).toBeInTheDocument();
    expect(within(row).queryByText(SEED_COST_STATUS_LABEL)).not.toBeInTheDocument();
    expect(within(row).getAllByText(NOT_COMPUTABLE_MARK)).toHaveLength(2);
  });

  it('shows the error state with a retry when the list fails', async () => {
    mockServer.use(
      http.get(apiPattern(API_PATHS.PROJECTS), () =>
        HttpResponse.json(errorBody(ERROR_CODE.INTERNAL_ERROR, 'lista caída'), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        }),
      ),
    );
    renderPortfolio(ROLES.REVIEWER);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('lista caída');
    expect(within(alert).getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('announces the loading state with skeletons instead of a spinner', () => {
    renderPortfolio(ROLES.REVIEWER);

    expect(screen.getByRole('status')).toHaveTextContent(PORTFOLIO_COPY.LOADING);
  });
});

describe('ProjectsPage with the eight demo projects', () => {
  it('numbers every project and shows the two indices in the ink of their own semaphore', async () => {
    await renderSeededPortfolio();

    expect(screen.getByRole('heading', { name: '8 proyectos' })).toBeInTheDocument();
    for (const seeded of SEEDED_PROJECTS) {
      expect(screen.getByRole('link', { name: seeded.name })).toBeInTheDocument();
    }

    const row = rowOf(SEED_PROJECT_NAME);
    expect(within(row).getByText('01')).toBeInTheDocument();
    expect(within(row).getByText('0,9206')).toBeInTheDocument();
    expect(within(row).getByText('0,9063')).toBeInTheDocument();
  });

  it('adds up the reports in the KPI strip', async () => {
    await renderSeededPortfolio();
    const strip = within(kpiStrip());

    expect(strip.getByText('313.000')).toBeInTheDocument();
    expect(strip.getByText('BAC sumado · 7 proyectos con actividades')).toBeInTheDocument();
    expect(strip.getByText('165.750')).toBeInTheDocument();
    /** Over budget: 01, 03, 07 · behind schedule: 01, 04, 06 → five distinct projects. */
    expect(strip.getByText('5')).toBeInTheDocument();
    expect(strip.getByText('+4.173')).toBeInTheDocument();
  });

  it('marks the misleading CPI of App móvil de campo as drawn off scale', async () => {
    await renderSeededPortfolio();

    const row = rowOf('App móvil de campo');
    expect(within(row).getByText('1,8125')).toBeInTheDocument();
    expect(within(row).getByText('0,3452')).toBeInTheDocument();
    expect(within(row).getByText('Bajo presupuesto')).toBeInTheDocument();
    expect(within(row).getByText('Atrasado')).toBeInTheDocument();
    expect(within(row).getByText('4 actividades')).toBeInTheDocument();

    expect(
      screen.getByText(new RegExp(`${PORTFOLIO_COPY.QUADRANT.OFF_SCALE_NOTE_PREFIX}06`, 'i')),
    ).toHaveTextContent('App móvil de campo');
  });

  it('reads the project without activities as not applicable and draws no bubble for it', async () => {
    await renderSeededPortfolio();

    const row = rowOf('Tablero de indicadores');
    expect(within(row).getByText(PORTFOLIO_COPY.LIST.NO_ACTIVITIES)).toBeInTheDocument();
    expect(within(row).getAllByText('No aplica')).toHaveLength(2);
    expect(within(row).getAllByText(NOT_COMPUTABLE_MARK)).toHaveLength(2);

    const chart = within(quadrant());
    expect(chart.getByText('01')).toBeInTheDocument();
    expect(chart.queryByText('08')).not.toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(PORTFOLIO_COPY.QUADRANT.NOT_PLOTTED_NOTE_PREFIX, 'i')),
    ).toHaveTextContent('08 · Tablero de indicadores');
  });

  it('ships the figures of the quadrant as text next to the chart', async () => {
    await renderSeededPortfolio();

    const table = screen.getByRole('table', { name: PORTFOLIO_COPY.QUADRANT.TABLE.CAPTION });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(SEEDED_PROJECTS.length + 1);

    const offScaleRow = within(table).getByRole('rowheader', { name: '06' }).closest('tr');
    expect(offScaleRow).not.toBeNull();
    expect(offScaleRow).toHaveTextContent('1,8125');
    expect(offScaleRow).toHaveTextContent('0,3452');
    expect(offScaleRow).toHaveTextContent('43.000,00');

    const notPlottedRow = within(table).getByRole('rowheader', { name: '08' }).closest('tr');
    expect(notPlottedRow).toHaveTextContent(NOT_COMPUTABLE_MARK);
    expect(notPlottedRow).toHaveTextContent('No aplica');
  });

  it('leaves a broken report out of the totals instead of counting it as zero', async () => {
    await renderSeededPortfolio(`${PROJECT_ID_PREFIX}1`);

    const row = rowOf(SEED_PROJECT_NAME);
    expect(within(row).getByText(STATUS_UNAVAILABLE_LABEL)).toBeInTheDocument();
    /** 313.000 − 60.000 of the project whose report could not be read. */
    expect(within(kpiStrip()).getByText('253.000')).toBeInTheDocument();
    expect(
      within(kpiStrip()).getByText('BAC sumado · 6 proyectos con actividades'),
    ).toBeInTheDocument();
  });
});

describe('ProjectsPage permissions', () => {
  it('offers create, edit and delete to a REVIEWER', async () => {
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    expect(screen.getByRole('button', { name: NEW_PROJECT_ACTION })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Editar ${SEED_PROJECT_NAME}` })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Eliminar ${SEED_PROJECT_NAME}` }),
    ).toBeInTheDocument();
  });

  it('hides every management action from a REGISTRAR', async () => {
    renderPortfolio(ROLES.REGISTRAR);
    await findSeedProjectLink();

    expect(screen.queryByRole('button', { name: NEW_PROJECT_ACTION })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `Editar ${SEED_PROJECT_NAME}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `Eliminar ${SEED_PROJECT_NAME}` }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: SEED_PROJECT_NAME })).toBeInTheDocument();
  });

  it('invites a REVIEWER to create the first project when the portfolio is empty', async () => {
    mockServer.use(emptyProjectList());
    renderPortfolio(ROLES.REVIEWER);

    expect(await screen.findByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: NEW_PROJECT_ACTION })).toBeInTheDocument();
  });

  it('shows a REGISTRAR a plain message when the portfolio is empty', async () => {
    mockServer.use(emptyProjectList());
    renderPortfolio(ROLES.REGISTRAR);

    expect(await screen.findByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PORTFOLIO_COPY.EMPTY.READ_ONLY_BODY)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: NEW_PROJECT_ACTION })).not.toBeInTheDocument();
  });
});

describe('ProjectsPage create and edit', () => {
  it('creates a project and refreshes the portfolio', async () => {
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: NEW_PROJECT_ACTION }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(NAME_LABEL), NEW_PROJECT_NAME);
    await user.type(within(dialog).getByLabelText(DESCRIPTION_LABEL), NEW_PROJECT_DESCRIPTION);
    await user.click(within(dialog).getByRole('button', { name: CREATE_SUBMIT }));

    expect(await screen.findByRole('link', { name: NEW_PROJECT_NAME })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2 proyectos' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('validates the name in the browser before calling the API', async () => {
    let createCalls = 0;
    mockServer.use(
      http.post(apiPattern(API_PATHS.PROJECTS), () => {
        createCalls += 1;
        return HttpResponse.json(errorBody(ERROR_CODE.INTERNAL_ERROR, 'no debería llamarse'), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }),
    );
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: NEW_PROJECT_ACTION }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: CREATE_SUBMIT }));
    expect(within(dialog).getByText(PROJECT_FORM_MESSAGES.NAME_REQUIRED)).toBeInTheDocument();

    await user.click(within(dialog).getByLabelText(NAME_LABEL));
    await user.paste('x'.repeat(PROJECT_NAME_MAX_LENGTH + 1));
    await user.click(within(dialog).getByRole('button', { name: CREATE_SUBMIT }));
    expect(within(dialog).getByText(PROJECT_FORM_MESSAGES.NAME_TOO_LONG)).toBeInTheDocument();

    expect(createCalls).toBe(0);
  });

  it('shows a server validation error on the field it belongs to', async () => {
    mockServer.use(
      http.post(apiPattern(API_PATHS.PROJECTS), () =>
        HttpResponse.json(errorBody(ERROR_CODE.VALIDATION_ERROR, SERVER_NAME_MESSAGE, 'name'), {
          status: HTTP_STATUS.BAD_REQUEST,
        }),
      ),
    );
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: NEW_PROJECT_ACTION }));
    const dialog = screen.getByRole('dialog');
    const nameInput = within(dialog).getByLabelText(NAME_LABEL);
    await user.type(nameInput, NEW_PROJECT_NAME);
    await user.click(within(dialog).getByRole('button', { name: CREATE_SUBMIT }));

    expect(await within(dialog).findByText(SERVER_NAME_MESSAGE)).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAccessibleDescription(SERVER_NAME_MESSAGE);
  });

  it('edits a project from its own row', async () => {
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: `Editar ${SEED_PROJECT_NAME}` }));
    const dialog = screen.getByRole('dialog');
    const nameInput = within(dialog).getByLabelText(NAME_LABEL);
    expect(nameInput).toHaveValue(SEED_PROJECT_NAME);

    await user.clear(nameInput);
    await user.type(nameInput, NEW_PROJECT_NAME);
    await user.click(within(dialog).getByRole('button', { name: SAVE_SUBMIT }));

    expect(await screen.findByRole('link', { name: NEW_PROJECT_NAME })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: SEED_PROJECT_NAME })).not.toBeInTheDocument();
  });
});

describe('ProjectsPage delete', () => {
  it('asks for confirmation before deleting and warns about the activities', async () => {
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: `Eliminar ${SEED_PROJECT_NAME}` }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(CASCADE_WARNING)).toBeInTheDocument();
    expect(await findSeedProjectLink()).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: CANCEL_ACTION }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await findSeedProjectLink()).toBeInTheDocument();
  });

  it('deletes the project after the confirmation and refreshes the portfolio', async () => {
    const user = userEvent.setup();
    renderPortfolio(ROLES.REVIEWER);
    await findSeedProjectLink();

    await user.click(screen.getByRole('button', { name: `Eliminar ${SEED_PROJECT_NAME}` }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: CONFIRM_DELETE_ACTION }),
    );

    expect(await screen.findByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: SEED_PROJECT_NAME })).not.toBeInTheDocument();
  });
});

describe('role-aware landing', () => {
  it('lands a REVIEWER on the portfolio', async () => {
    signInAs(ROLES.REVIEWER);
    const { router } = renderWithRouter({ routes: appRoutes, initialPath: ROUTES.ROOT });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.PROJECTS);
    });
    expect(await findSeedProjectLink()).toBeInTheDocument();
  });

  it('lands a REGISTRAR on "mis actividades"', async () => {
    signInAs(ROLES.REGISTRAR);
    const { router } = renderWithRouter({ routes: appRoutes, initialPath: ROUTES.ROOT });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.MY_ACTIVITIES);
    });
    expect(screen.getByRole('heading', { name: /mis actividades/i })).toBeInTheDocument();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { API_PATHS } from '@/api/endpoints';
import { ERROR_CODE, ROLES } from '@/api/types';
import { appRoutes } from '@/app/router';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { projectDashboardPath, ROUTES } from '@/constants/routes';
import { formatIndex } from '@/lib/format';
import { issueMockToken } from '@/mocks/auth';
import { resetMockDatabase } from '@/mocks/db';
import { evmReportFixture, usersFixture } from '@/mocks/fixtures';
import { SEED_IDS } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';
import { setSession } from '@/session/session-store';
import { renderWithRouter } from '@/test/render';

import { PROJECT_FORM_MESSAGES, PROJECT_NAME_MAX_LENGTH } from './project-form';
import { ProjectsPage } from './ProjectsPage';

import type { ApiErrorBody, Project, Role, User } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

/** docs/api/fixtures: the seeded project and the report the portfolio must show for it. */
const SEED_PROJECT_NAME = 'Portal de clientes';
const SEED_ACTIVITY_COUNT_LABEL = '3 actividades';
const SEED_COST_STATUS_LABEL = 'Sobre presupuesto';
const SEED_SCHEDULE_STATUS_LABEL = 'Atrasado';
const STATUS_UNAVAILABLE_LABEL = 'Estado no disponible';

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

/**
 * Signs in as a seed user with a token the mock backend accepts (`test/render`'s helper uses
 * an opaque token that MSW rejects with 401).
 */
function signIn(role: Role): User {
  const user = usersFixture.find((candidate) => candidate.role === role);
  if (user === undefined) {
    throw new Error(`No seed user with role ${role}`);
  }
  setSession({ accessToken: issueMockToken(user.id), user });
  return user;
}

function renderPortfolio(role: Role) {
  signIn(role);
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
    expect(screen.getByText(SEED_ACTIVITY_COUNT_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SEED_COST_STATUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SEED_SCHEDULE_STATUS_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(formatIndex(evmReportFixture.project.indicators.costPerformanceIndex)),
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
    expect(screen.getByText(STATUS_UNAVAILABLE_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(SEED_COST_STATUS_LABEL)).not.toBeInTheDocument();
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
  });

  it('invites a REVIEWER to create the first project when the portfolio is empty', async () => {
    mockServer.use(emptyProjectList());
    renderPortfolio(ROLES.REVIEWER);

    expect(await screen.findByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: NEW_PROJECT_ACTION })).toHaveLength(2);
  });

  it('shows a REGISTRAR a plain message when the portfolio is empty', async () => {
    mockServer.use(emptyProjectList());
    renderPortfolio(ROLES.REGISTRAR);

    expect(await screen.findByText(EMPTY_TITLE)).toBeInTheDocument();
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
    expect(screen.getByText(NEW_PROJECT_DESCRIPTION)).toBeInTheDocument();
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

  it('edits a project from its own card', async () => {
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
    signIn(ROLES.REVIEWER);
    const { router } = renderWithRouter({ routes: appRoutes, initialPath: ROUTES.ROOT });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.PROJECTS);
    });
    expect(await findSeedProjectLink()).toBeInTheDocument();
  });

  it('lands a REGISTRAR on "mis actividades"', async () => {
    signIn(ROLES.REGISTRAR);
    const { router } = renderWithRouter({ routes: appRoutes, initialPath: ROUTES.ROOT });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(ROUTES.MY_ACTIVITIES);
    });
    expect(screen.getByRole('heading', { name: /mis actividades/i })).toBeInTheDocument();
  });
});

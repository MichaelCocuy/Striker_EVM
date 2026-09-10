import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ROLES } from '@/api/types';
import { activityDetailPath, projectDashboardPath, ROUTES } from '@/constants/routes';
import { renderWithRouter, signInAs } from '@/test/render';

import { AppLayout } from './AppLayout';
import { LAYOUT_ID } from './layout-constants';

import type { Role } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

const VIEW_TEXT = 'Contenido de la vista';
const PROJECT_ID = '22222222-2222-4222-8222-000000000001';
const ACTIVITY_ID = '33333333-3333-4333-8333-000000000001';
const ACTIVITY_TITLE = 'Actividad';

const GROUP = { TRACKING: 'Seguimiento', MY_WORK: 'Mi trabajo' } as const;
const NAME = {
  TOGGLE: /mostrar u ocultar la navegación/i,
  CLOSE_DRAWER: /cerrar la navegación/i,
  SKIP: /saltar al contenido/i,
} as const;

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.PROJECTS, element: <p>{VIEW_TEXT}</p> },
      { path: ROUTES.PROJECT_DASHBOARD, element: <p>{VIEW_TEXT}</p> },
      { path: ROUTES.ACTIVITY_DETAIL, element: <p>{VIEW_TEXT}</p> },
      { path: ROUTES.MY_ACTIVITIES, element: <p>{VIEW_TEXT}</p> },
    ],
  },
];

function renderShell(role: Role, initialPath: string) {
  const user = signInAs(role);
  const view = renderWithRouter({ routes, initialPath });
  return { ...view, user };
}

describe('AppLayout', () => {
  it('renders the view inside the shell', () => {
    renderShell(ROLES.REVIEWER, ROUTES.PROJECTS);

    expect(screen.getByText(VIEW_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', LAYOUT_ID.MAIN);
  });

  it('shows a REVIEWER the tracking group only', () => {
    renderShell(ROLES.REVIEWER, ROUTES.PROJECTS);

    expect(screen.getByRole('navigation', { name: GROUP.TRACKING })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: GROUP.MY_WORK })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portafolio' })).toHaveAttribute(
      'href',
      ROUTES.PROJECTS,
    );
  });

  it('shows a REGISTRAR their own work and no portfolio', () => {
    renderShell(ROLES.REGISTRAR, ROUTES.MY_ACTIVITIES);

    expect(screen.getByRole('navigation', { name: GROUP.MY_WORK })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: GROUP.TRACKING })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Portafolio' })).not.toBeInTheDocument();
  });

  it('offers the dashboard of the project the reader has open', () => {
    renderShell(ROLES.REVIEWER, projectDashboardPath(PROJECT_ID));

    expect(screen.getByRole('link', { name: 'Tablero del proyecto' })).toHaveAttribute(
      'href',
      projectDashboardPath(PROJECT_ID),
    );
  });

  /** The generic «Striker EVM · Valor ganado» is what an unnamed route falls back to. */
  it('names the activity detail in the topbar instead of falling back to the product', () => {
    renderShell(ROLES.REVIEWER, activityDetailPath(PROJECT_ID, ACTIVITY_ID));

    expect(screen.getByText(ACTIVITY_TITLE)).toBeInTheDocument();
  });

  it('names the signed-in user in the topbar', () => {
    const { user } = renderShell(ROLES.REVIEWER, ROUTES.PROJECTS);

    expect(screen.getByTestId('user-chip')).toHaveTextContent(user.fullName);
  });

  it('opens the navigation drawer from the topbar and closes it from the backdrop', async () => {
    renderShell(ROLES.REVIEWER, ROUTES.PROJECTS);
    const toggle = screen.getByRole('button', { name: NAME.TOGGLE });
    expect(screen.queryByRole('button', { name: NAME.CLOSE_DRAWER })).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const backdrop = screen.getByRole('button', { name: NAME.CLOSE_DRAWER });

    await userEvent.click(backdrop);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the drawer when one of its links is followed', async () => {
    renderShell(ROLES.REVIEWER, projectDashboardPath(PROJECT_ID));
    await userEvent.click(screen.getByRole('button', { name: NAME.TOGGLE }));

    await userEvent.click(screen.getByRole('link', { name: 'Portafolio' }));

    expect(screen.getByRole('button', { name: NAME.TOGGLE })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('lets the keyboard skip straight to the content', () => {
    renderShell(ROLES.REVIEWER, ROUTES.PROJECTS);

    expect(screen.getByRole('link', { name: NAME.SKIP })).toHaveAttribute(
      'href',
      `#${LAYOUT_ID.MAIN}`,
    );
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
});

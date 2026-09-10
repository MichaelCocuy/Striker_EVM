import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { SEED_PASSWORD } from '@/mocks/seed';
import { renderWithRouter, SEED_USER_EMAIL } from '@/test/render';

import { LOGIN_VALIDATION_MESSAGES } from './login-validation';
import { LoginPage } from './LoginPage';

import type { RouteObject } from 'react-router-dom';

/** The demo shortcuts only exist in mock mode, so the view is rendered with mocks enabled. */
vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: '/api/v1', useMocks: true, isDevelopment: true },
}));

const LABEL = {
  EMAIL: /correo electrónico/i,
  PASSWORD: /contraseña/i,
  THEME: /cambiar a tema/i,
  USE_REVIEWER: `Usar la cuenta ${SEED_USER_EMAIL.REVIEWER}`,
} as const;

const COPY = {
  HEADLINE: /¿sabes hoy si el proyecto va bien/i,
  SUBCOPY: /valor ganado calculado sobre lo que registran tus líderes/i,
  STANDARD_CHIP: /pmi · earned value/i,
  INDICATORS_CHIP: /cpi · spi · eac · vac/i,
  ACCESS: /acceso/i,
} as const;

const routes: RouteObject[] = [{ path: ROUTES.LOGIN, element: <LoginPage /> }];

function renderLogin() {
  return renderWithRouter({ routes, initialPath: ROUTES.LOGIN, authApi: { login: vi.fn() } });
}

describe('the login view of the redesign', () => {
  it('leads with the question the product answers', () => {
    renderLogin();

    expect(screen.getByRole('heading', { level: 1, name: COPY.HEADLINE })).toBeInTheDocument();
    expect(screen.getByText(COPY.SUBCOPY)).toBeInTheDocument();
    expect(screen.getByText(COPY.STANDARD_CHIP)).toBeInTheDocument();
    expect(screen.getByText(COPY.INDICATORS_CHIP)).toBeInTheDocument();
  });

  it('offers a single way in, as production does', () => {
    renderLogin();

    expect(screen.getByText(COPY.ACCESS)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /inicia sesión/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^entrar$/i })).toHaveLength(1);
  });

  it('fills the form from a seed account so an evaluator need not type', async () => {
    renderLogin();

    await userEvent.click(await screen.findByRole('button', { name: LABEL.USE_REVIEWER }));

    expect(screen.getByLabelText(LABEL.EMAIL)).toHaveValue(SEED_USER_EMAIL.REVIEWER);
    expect(screen.getByLabelText(LABEL.PASSWORD)).toHaveValue(SEED_PASSWORD);
  });

  it('walks the keyboard from the theme toggle into the form', async () => {
    renderLogin();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: LABEL.THEME })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(LABEL.EMAIL)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(LABEL.PASSWORD)).toHaveFocus();
  });

  it('describes an invalid field to the control that carries it', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    const email = screen.getByLabelText(LABEL.EMAIL);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription(LOGIN_VALIDATION_MESSAGES.EMAIL_REQUIRED);
  });
});

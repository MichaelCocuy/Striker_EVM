import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';
import { ROLES } from '@/api/types';
import { HTTP_STATUS } from '@/constants/http';
import { ROUTES } from '@/constants/routes';
import { getSession } from '@/session/session-store';
import { renderWithRouter, TEST_TOKEN, TEST_USERS } from '@/test/render';

import { LOGIN_VALIDATION_MESSAGES } from './login-validation';
import { LoginPage } from './LoginPage';

import type { LoginResponse } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

const HOME_TEXT = 'Inicio autenticado';
const EMAIL_LABEL = /correo electrónico/i;
const PASSWORD_LABEL = /contraseña/i;
const SUBMIT_LABEL = /entrar/i;

const routes: RouteObject[] = [
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.ROOT, element: <p>{HOME_TEXT}</p> },
];

function successfulLogin(): LoginResponse {
  return { accessToken: TEST_TOKEN, tokenType: 'bearer', user: TEST_USERS[ROLES.REVIEWER] };
}

describe('LoginPage', () => {
  it('validates the form before calling the API', async () => {
    const login = vi.fn();
    renderWithRouter({ routes, initialPath: ROUTES.LOGIN, authApi: { login } });

    await userEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(screen.getByText(LOGIN_VALIDATION_MESSAGES.EMAIL_REQUIRED)).toBeInTheDocument();
    expect(screen.getByText(LOGIN_VALIDATION_MESSAGES.PASSWORD_REQUIRED)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('flags a malformed email', async () => {
    const login = vi.fn();
    renderWithRouter({ routes, initialPath: ROUTES.LOGIN, authApi: { login } });

    await userEvent.type(screen.getByLabelText(EMAIL_LABEL), 'not-an-email');
    await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), 'Striker2026!');
    await userEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(screen.getByText(LOGIN_VALIDATION_MESSAGES.EMAIL_INVALID)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('stores the session and navigates home after a successful login', async () => {
    const login = vi.fn().mockResolvedValue(successfulLogin());
    renderWithRouter({ routes, initialPath: ROUTES.LOGIN, authApi: { login } });

    await userEvent.type(screen.getByLabelText(EMAIL_LABEL), 'revisor@striker.local');
    await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), 'Striker2026!');
    await userEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    await waitFor(() => expect(screen.getByText(HOME_TEXT)).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith({
      email: 'revisor@striker.local',
      password: 'Striker2026!',
    });
    expect(getSession()?.accessToken).toBe(TEST_TOKEN);
  });

  it('shows an error state when credentials are rejected', async () => {
    const login = vi.fn().mockRejectedValue(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, {
        code: 'UNAUTHORIZED',
        message: 'nope',
        details: [],
      }),
    );
    renderWithRouter({ routes, initialPath: ROUTES.LOGIN, authApi: { login } });

    await userEvent.type(screen.getByLabelText(EMAIL_LABEL), 'revisor@striker.local');
    await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
    expect(getSession()).toBeNull();
  });
});

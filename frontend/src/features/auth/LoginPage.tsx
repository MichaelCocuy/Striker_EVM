import { lazy, Suspense, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { isApiError } from '@/api/errors';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';
import { ROUTES } from '@/constants/routes';
import { usePageTransition } from '@/motion/usePageTransition';

import { hasErrors, validateLogin } from './login-validation';
import { useAuth } from './useAuth';

import type { LoginFieldErrors } from './login-validation';
import type { LoginRedirectState } from './RequireAuth';
import type { LoginRequest } from '@/api/types';
import type { ChangeEvent, FormEvent } from 'react';

const MockCredentialsHint = lazy(() => import('./MockCredentialsHint'));

const COPY = {
  EYEBROW: 'Bienvenido',
  TITLE: 'Inicia sesión',
  SUBTITLE: 'Consulta el valor ganado de tus proyectos y registra el avance de tus actividades.',
  EMAIL_LABEL: 'Correo electrónico',
  PASSWORD_LABEL: 'Contraseña',
  SUBMIT: 'Entrar',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  GENERIC_ERROR: 'No fue posible iniciar sesión. Intenta de nuevo.',
} as const;

const EMPTY_FORM: LoginRequest = { email: '', password: '' };

function resolveDestination(state: unknown): string {
  const redirect = state as Partial<LoginRedirectState> | null;
  return redirect?.from?.pathname ?? ROUTES.ROOT;
}

function describeLoginError(error: unknown): string {
  if (isApiError(error) && error.status === HTTP_STATUS.UNAUTHORIZED) {
    return COPY.INVALID_CREDENTIALS;
  }
  if (isApiError(error) && error.status !== 0) {
    return error.message;
  }
  return COPY.GENERIC_ERROR;
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = usePageTransition<HTMLDivElement>(location.pathname);

  const [values, setValues] = useState<LoginRequest>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={resolveDestination(location.state)} replace />;
  }

  const updateField = (field: keyof LoginRequest) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateLogin(values);
    setFieldErrors(errors);
    setSubmitError(null);
    if (hasErrors(errors)) {
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(resolveDestination(location.state), { replace: true });
    } catch (error) {
      setSubmitError(describeLoginError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div ref={pageRef} className="flex w-full max-w-md flex-col gap-8">
        <BrandMark />
        <section className="card flex flex-col gap-6 p-8 shadow-raised">
          <header className="flex flex-col gap-2">
            <p className="eyebrow">{COPY.EYEBROW}</p>
            <h1 className="text-2xl font-semibold text-ink">{COPY.TITLE}</h1>
            <p className="text-sm text-ink-muted">{COPY.SUBTITLE}</p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <TextField
              label={COPY.EMAIL_LABEL}
              name="email"
              type="email"
              autoComplete="username"
              value={values.email}
              onChange={updateField('email')}
              error={fieldErrors.email}
              required
            />
            <TextField
              label={COPY.PASSWORD_LABEL}
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={updateField('password')}
              error={fieldErrors.password}
              required
            />
            {submitError && (
              <p
                role="alert"
                className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
              >
                {submitError}
              </p>
            )}
            <Button type="submit" loading={submitting} className="mt-1 w-full">
              {COPY.SUBMIT}
            </Button>
          </form>
        </section>

        {env.useMocks && (
          <Suspense fallback={null}>
            <MockCredentialsHint />
          </Suspense>
        )}
      </div>
    </div>
  );
}

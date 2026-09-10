import { lazy, Suspense, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { isApiError } from '@/api/errors';
import {
  BRAND_MARK_TONE,
  BRAND_MARK_VARIANT,
  BRAND_TILE_SIZE,
} from '@/components/ui/brand-variants';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { BUTTON_SIZE } from '@/components/ui/button-variants';
import { Chip } from '@/components/ui/Chip';
import { CHIP_TONE } from '@/components/ui/chip-tones';
import { ICON_BUTTON_TONE } from '@/components/ui/icon-button-tones';
import { ICON_SIZE, ICON_STROKE, TriangleAlert } from '@/components/ui/icons';
import { OrbitalFigure } from '@/components/ui/OrbitalFigure';
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
  HEADLINE: '¿Sabes hoy si el proyecto va bien, o solo cuánto llevas gastado?',
  SUBCOPY:
    'Valor ganado calculado sobre lo que registran tus líderes. Costo y cronograma en la misma lectura, sin hojas de cálculo intermedias.',
  STANDARD_CHIP: 'PMI · Earned Value',
  INDICATORS_CHIP: 'CPI · SPI · EAC · VAC',
  EYEBROW: 'Acceso',
  TITLE: 'Inicia sesión',
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

/**
 * View 1 of the redesign: the brand claim on the navy gradient beside the access card.
 *
 * The screen is full height and the grid is centred inside it: the outer box carries both, or
 * the composition anchors to the top and leaves the lower half of the gradient empty.
 *
 * The two columns are the handoff's auto-fit grid, so they stack on their own when the viewport
 * cannot hold two 340px tracks — but only from `sm` up. Below that, `minmax(340px, 1fr)` would
 * hold a track wider than the viewport itself (340px plus the padding exceeds a 360px screen)
 * and the row would overflow sideways, so the narrowest screens get a plain single column.
 *
 * Production ships a single «Entrar»; the demo shortcuts that let an evaluator sign in as
 * either role live in the mock-only credentials hint.
 */
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

  const useCredentials = (credentials: LoginRequest) => {
    setValues(credentials);
    setFieldErrors({});
    setSubmitError(null);
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
    <div className="relative flex min-h-dvh items-center bg-[image:var(--tc-grad-sidebar)]">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle tone={ICON_BUTTON_TONE.ON_NAVY} />
      </div>
      <div
        ref={pageRef}
        className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-6 py-14 sm:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] sm:px-12"
      >
        <BrandPitch />

        <section className="card flex flex-col gap-5 p-8 shadow-raised">
          <header className="flex flex-col gap-1.5">
            <p className="eyebrow">{COPY.EYEBROW}</p>
            <h2 className="text-h2 font-bold text-ink">{COPY.TITLE}</h2>
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
            {submitError !== null && <SubmitError message={submitError} />}
            <Button
              type="submit"
              size={BUTTON_SIZE.LG}
              loading={submitting}
              className="mt-1 w-full"
            >
              {COPY.SUBMIT}
            </Button>
          </form>

          {env.useMocks && (
            <Suspense fallback={null}>
              <MockCredentialsHint onUseCredentials={useCredentials} />
            </Suspense>
          )}
        </section>
      </div>
    </div>
  );
}

/** Left column: the question the product answers, over the orbital geometry of the brand. */
function BrandPitch() {
  return (
    <div className="relative flex flex-col gap-7">
      <OrbitalFigure className="absolute -top-[70px] -left-[110px] size-[420px] opacity-50" />
      <span className="relative">
        <BrandMark
          variant={BRAND_MARK_VARIANT.WORDMARK}
          tone={BRAND_MARK_TONE.ON_NAVY}
          size={BRAND_TILE_SIZE.MD}
        />
      </span>
      <h1 className="relative max-w-[15ch] font-heading text-[44px] leading-[1.12] font-bold tracking-figure text-white">
        {COPY.HEADLINE}
      </h1>
      <p className="relative max-w-[44ch] font-heading text-[17px] leading-normal font-normal text-white/72">
        {COPY.SUBCOPY}
      </p>
      <div className="relative flex flex-wrap gap-2.5">
        <Chip tone={CHIP_TONE.BRAND_ON_NAVY}>{COPY.STANDARD_CHIP}</Chip>
        <Chip tone={CHIP_TONE.OUTLINE_ON_NAVY}>{COPY.INDICATORS_CHIP}</Chip>
      </div>
    </div>
  );
}

interface SubmitErrorProps {
  message: string;
}

function SubmitError({ message }: SubmitErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md bg-danger-soft px-4 py-[14px] text-danger"
    >
      <TriangleAlert
        aria-hidden="true"
        size={ICON_SIZE.CONTENT}
        strokeWidth={ICON_STROKE.ALERT}
        className="mt-px shrink-0"
      />
      <p className="text-small">{message}</p>
    </div>
  );
}

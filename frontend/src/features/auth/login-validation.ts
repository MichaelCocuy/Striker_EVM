import type { LoginRequest } from '@/api/types';

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LOGIN_VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Ingresa tu correo electrónico',
  EMAIL_INVALID: 'El correo no tiene un formato válido',
  PASSWORD_REQUIRED: 'Ingresa tu contraseña',
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
} as const;

export type LoginFieldErrors = Partial<Record<keyof LoginRequest, string>>;

export function validateLogin(values: LoginRequest): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = values.email.trim();

  if (email === '') {
    errors.email = LOGIN_VALIDATION_MESSAGES.EMAIL_REQUIRED;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = LOGIN_VALIDATION_MESSAGES.EMAIL_INVALID;
  }

  if (values.password === '') {
    errors.password = LOGIN_VALIDATION_MESSAGES.PASSWORD_REQUIRED;
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = LOGIN_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
  }

  return errors;
}

export function hasErrors(errors: LoginFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

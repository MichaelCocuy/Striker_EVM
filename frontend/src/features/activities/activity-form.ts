import { ERROR_CODE } from '@/api/errors';

import type { ApiError } from '@/api/errors';
import type { ActivityInput, EvmActivityReport } from '@/api/types';

/**
 * Client-side mirror of the `ActivityInput` rules of docs/api/openapi.yaml. The backend
 * validates the same limits and answers `VALIDATION_ERROR`; validating here only spares the
 * user a round trip. Nothing in this module computes an EVM indicator.
 */
export const ACTIVITY_LIMITS = {
  NAME_MAX_LENGTH: 120,
  BUDGET_MIN_EXCLUSIVE: 0,
  MONEY_MIN: 0,
  MONEY_MAX: 999999999999.99,
  PERCENT_MIN: 0,
  PERCENT_MAX: 100,
} as const;

export const ACTIVITY_FIELDS = {
  NAME: 'name',
  OWNER_ID: 'ownerId',
  BUDGET_AT_COMPLETION: 'budgetAtCompletion',
  PLANNED_PROGRESS_PERCENT: 'plannedProgressPercent',
  ACTUAL_PROGRESS_PERCENT: 'actualProgressPercent',
  ACTUAL_COST: 'actualCost',
} as const;

export type ActivityFormField = (typeof ACTIVITY_FIELDS)[keyof typeof ACTIVITY_FIELDS];

const ACTIVITY_FORM_FIELDS: readonly ActivityFormField[] = Object.values(ACTIVITY_FIELDS);

/** The form keeps every field as text so what the user typed survives a failed submit. */
export type ActivityFormValues = Record<ActivityFormField, string>;

export type ActivityFieldErrors = Partial<Record<ActivityFormField, string>>;

export const ACTIVITY_FORM_MESSAGES = {
  NAME_REQUIRED: 'Escribe el nombre de la actividad.',
  NAME_TOO_LONG: `El nombre no puede superar ${ACTIVITY_LIMITS.NAME_MAX_LENGTH} caracteres.`,
  OWNER_REQUIRED: 'Selecciona el responsable de la actividad.',
  NUMBER_INVALID: 'Escribe un número válido.',
  BUDGET_POSITIVE: 'El presupuesto (BAC) debe ser mayor que 0.',
  MONEY_TOO_LARGE: 'El monto excede el máximo permitido.',
  PERCENT_RANGE: 'El porcentaje debe estar entre 0 y 100.',
  COST_NEGATIVE: 'El costo real no puede ser negativo.',
  FORBIDDEN: 'No tienes permiso para editar esta actividad.',
} as const;

const DECIMAL_SEPARATOR = ',';
const CANONICAL_DECIMAL_SEPARATOR = '.';
const EMPTY = '';

export const EMPTY_ACTIVITY_FORM_VALUES: ActivityFormValues = {
  [ACTIVITY_FIELDS.NAME]: EMPTY,
  [ACTIVITY_FIELDS.OWNER_ID]: EMPTY,
  [ACTIVITY_FIELDS.BUDGET_AT_COMPLETION]: EMPTY,
  [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: EMPTY,
  [ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT]: EMPTY,
  [ACTIVITY_FIELDS.ACTUAL_COST]: EMPTY,
};

/** Pre-fills the form from a report row so editing starts from the stored raw measures. */
export function activityFormValuesFrom(activity: EvmActivityReport): ActivityFormValues {
  return {
    [ACTIVITY_FIELDS.NAME]: activity.name,
    [ACTIVITY_FIELDS.OWNER_ID]: activity.owner.id,
    [ACTIVITY_FIELDS.BUDGET_AT_COMPLETION]: String(activity.input.budgetAtCompletion),
    [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: String(activity.input.plannedProgressPercent),
    [ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT]: String(activity.input.actualProgressPercent),
    [ACTIVITY_FIELDS.ACTUAL_COST]: String(activity.input.actualCost),
  };
}

/** Accepts the comma the es-CO keyboard produces as well as the plain dot. */
export function parseDecimalInput(raw: string): number | null {
  const normalized = raw.trim().replaceAll(DECIMAL_SEPARATOR, CANONICAL_DECIMAL_SEPARATOR);
  if (normalized === EMPTY) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function validateName(raw: string): string | null {
  const name = raw.trim();
  if (name === EMPTY) {
    return ACTIVITY_FORM_MESSAGES.NAME_REQUIRED;
  }
  return name.length > ACTIVITY_LIMITS.NAME_MAX_LENGTH
    ? ACTIVITY_FORM_MESSAGES.NAME_TOO_LONG
    : null;
}

function validateBudget(value: number | null): string | null {
  if (value === null) {
    return ACTIVITY_FORM_MESSAGES.NUMBER_INVALID;
  }
  if (value <= ACTIVITY_LIMITS.BUDGET_MIN_EXCLUSIVE) {
    return ACTIVITY_FORM_MESSAGES.BUDGET_POSITIVE;
  }
  return value > ACTIVITY_LIMITS.MONEY_MAX ? ACTIVITY_FORM_MESSAGES.MONEY_TOO_LARGE : null;
}

function validatePercent(value: number | null): string | null {
  if (value === null) {
    return ACTIVITY_FORM_MESSAGES.NUMBER_INVALID;
  }
  return value < ACTIVITY_LIMITS.PERCENT_MIN || value > ACTIVITY_LIMITS.PERCENT_MAX
    ? ACTIVITY_FORM_MESSAGES.PERCENT_RANGE
    : null;
}

function validateCost(value: number | null): string | null {
  if (value === null) {
    return ACTIVITY_FORM_MESSAGES.NUMBER_INVALID;
  }
  if (value < ACTIVITY_LIMITS.MONEY_MIN) {
    return ACTIVITY_FORM_MESSAGES.COST_NEGATIVE;
  }
  return value > ACTIVITY_LIMITS.MONEY_MAX ? ACTIVITY_FORM_MESSAGES.MONEY_TOO_LARGE : null;
}

export interface ActivityInputOptions {
  /**
   * REVIEWER must send an existing `ownerId`; REGISTRAR sends none and the backend assigns
   * the activity to them (ARQUITECTURA §11).
   */
  requiresOwner: boolean;
}

export type ActivityInputResult =
  { ok: true; input: ActivityInput } | { ok: false; errors: ActivityFieldErrors };

/**
 * Validates the typed values and, when they are all valid, returns the request body.
 * Parsing and validating in one pass keeps the numbers non-nullable without assertions.
 */
export function buildActivityInput(
  values: ActivityFormValues,
  { requiresOwner }: ActivityInputOptions,
): ActivityInputResult {
  const budgetAtCompletion = parseDecimalInput(values.budgetAtCompletion);
  const plannedProgressPercent = parseDecimalInput(values.plannedProgressPercent);
  const actualProgressPercent = parseDecimalInput(values.actualProgressPercent);
  const actualCost = parseDecimalInput(values.actualCost);
  const ownerId = values.ownerId.trim();

  const errors = collectErrors({
    [ACTIVITY_FIELDS.NAME]: validateName(values.name),
    [ACTIVITY_FIELDS.OWNER_ID]:
      requiresOwner && ownerId === EMPTY ? ACTIVITY_FORM_MESSAGES.OWNER_REQUIRED : null,
    [ACTIVITY_FIELDS.BUDGET_AT_COMPLETION]: validateBudget(budgetAtCompletion),
    [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: validatePercent(plannedProgressPercent),
    [ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT]: validatePercent(actualProgressPercent),
    [ACTIVITY_FIELDS.ACTUAL_COST]: validateCost(actualCost),
  });

  if (
    errors !== null ||
    budgetAtCompletion === null ||
    plannedProgressPercent === null ||
    actualProgressPercent === null ||
    actualCost === null
  ) {
    return { ok: false, errors: errors ?? {} };
  }

  return {
    ok: true,
    input: {
      name: values.name.trim(),
      budgetAtCompletion,
      plannedProgressPercent,
      actualProgressPercent,
      actualCost,
      ...(requiresOwner ? { ownerId } : {}),
    },
  };
}

function collectErrors(
  candidates: Record<ActivityFormField, string | null>,
): ActivityFieldErrors | null {
  const errors: ActivityFieldErrors = {};
  let hasError = false;
  for (const field of ACTIVITY_FORM_FIELDS) {
    const message = candidates[field];
    if (message !== null) {
      errors[field] = message;
      hasError = true;
    }
  }
  return hasError ? errors : null;
}

export interface ActivityErrorFeedback {
  /** Server details that belong to a form field, ready to be shown next to it. */
  fieldErrors: ActivityFieldErrors;
  /** Message to show above the form when the failure is not tied to a field. */
  message: string | null;
}

function isActivityFormField(field: string | null | undefined): field is ActivityFormField {
  return ACTIVITY_FORM_FIELDS.some((candidate) => candidate === field);
}

/**
 * Splits an API failure into per-field messages and a general one (contract `Error` shape).
 *
 * A `403` is the permission matrix of ARQUITECTURA §11 answering, and its message comes from
 * the backend in English; it is replaced by the sentence the design asks for.
 */
export function activityErrorFeedback(error: ApiError): ActivityErrorFeedback {
  const fieldErrors: ActivityFieldErrors = {};
  if (error.code === ERROR_CODE.FORBIDDEN) {
    return { fieldErrors, message: ACTIVITY_FORM_MESSAGES.FORBIDDEN };
  }
  if (error.code === ERROR_CODE.VALIDATION_ERROR) {
    for (const detail of error.details) {
      if (isActivityFormField(detail.field)) {
        fieldErrors[detail.field] = detail.message;
      }
    }
  }
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  return { fieldErrors, message: hasFieldErrors ? null : error.message };
}

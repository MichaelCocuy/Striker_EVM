import { isApiError, ERROR_CODE } from '@/api/errors';

import type { Project, ProjectInput } from '@/api/types';

/**
 * Limits mirror the `ProjectInput` schema of docs/api/openapi.yaml, so the form rejects what
 * the backend would reject anyway. The server remains the authority: its `VALIDATION_ERROR`
 * details are surfaced per field by `readSubmitErrors`.
 */
export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;

export const PROJECT_FORM_MESSAGES = {
  NAME_REQUIRED: 'Ingresa el nombre del proyecto',
  NAME_TOO_LONG: `El nombre no puede superar los ${PROJECT_NAME_MAX_LENGTH} caracteres`,
  DESCRIPTION_TOO_LONG: `La descripción no puede superar los ${PROJECT_DESCRIPTION_MAX_LENGTH} caracteres`,
  UNEXPECTED: 'No pudimos guardar el proyecto. Intenta de nuevo.',
} as const;

/** Text state of the form; the API shape (`null` description) is built by `toProjectInput`. */
export interface ProjectFormValues {
  name: string;
  description: string;
}

export type ProjectFieldErrors = Partial<Record<keyof ProjectInput, string>>;

export interface ProjectSubmitErrors {
  fields: ProjectFieldErrors;
  /** Message for the whole form when no field owns the failure. */
  general: string | null;
}

const PROJECT_FIELDS: readonly (keyof ProjectInput)[] = ['name', 'description'];

export function emptyProjectValues(): ProjectFormValues {
  return { name: '', description: '' };
}

export function projectValuesOf(project: Project): ProjectFormValues {
  return { name: project.name, description: project.description ?? '' };
}

export function validateProject(values: ProjectFormValues): ProjectFieldErrors {
  const errors: ProjectFieldErrors = {};
  const name = values.name.trim();

  if (name === '') {
    errors.name = PROJECT_FORM_MESSAGES.NAME_REQUIRED;
  } else if (name.length > PROJECT_NAME_MAX_LENGTH) {
    errors.name = PROJECT_FORM_MESSAGES.NAME_TOO_LONG;
  }

  if (values.description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.description = PROJECT_FORM_MESSAGES.DESCRIPTION_TOO_LONG;
  }

  return errors;
}

export function hasProjectErrors(errors: ProjectFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Trims both fields; an empty description travels as `null`, as the contract expects. */
export function toProjectInput(values: ProjectFormValues): ProjectInput {
  const description = values.description.trim();
  return { name: values.name.trim(), description: description === '' ? null : description };
}

function isProjectField(field: string | null | undefined): field is keyof ProjectInput {
  return typeof field === 'string' && PROJECT_FIELDS.includes(field as keyof ProjectInput);
}

/**
 * Turns a rejected save into form state: `VALIDATION_ERROR` details that name a known field
 * become that field's message, anything else becomes the form-level message.
 */
export function readSubmitErrors(error: unknown): ProjectSubmitErrors {
  if (!isApiError(error)) {
    return { fields: {}, general: PROJECT_FORM_MESSAGES.UNEXPECTED };
  }
  const fields: ProjectFieldErrors = {};
  if (error.code === ERROR_CODE.VALIDATION_ERROR) {
    for (const detail of error.details) {
      if (isProjectField(detail.field)) {
        fields[detail.field] = detail.message;
      }
    }
  }
  return { fields, general: hasProjectErrors(fields) ? null : error.message };
}

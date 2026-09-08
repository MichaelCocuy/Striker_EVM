import { useState } from 'react';

import { api } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ErrorState } from '@/components/ui/ErrorState';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  emptyProjectValues,
  hasProjectErrors,
  projectValuesOf,
  readSubmitErrors,
  toProjectInput,
  validateProject,
} from './project-form';

import type { ProjectFieldErrors, ProjectFormValues } from './project-form';
import type { Project } from '@/api/types';
import type { FormEvent } from 'react';

const COPY = {
  ERROR_TITLE: 'No pudimos guardar el proyecto',
  NAME_LABEL: 'Nombre',
  NAME_HINT: `Obligatorio · máximo ${PROJECT_NAME_MAX_LENGTH} caracteres`,
  DESCRIPTION_LABEL: 'Descripción',
  DESCRIPTION_HINT: `Opcional · máximo ${PROJECT_DESCRIPTION_MAX_LENGTH} caracteres`,
  CANCEL: 'Cancelar',
  CREATE: 'Crear proyecto',
  SAVE: 'Guardar cambios',
} as const;

interface ProjectFormProps {
  /** `null` creates a project; otherwise the form edits that project. */
  project: Project | null;
  onSaved: () => void;
  onCancel: () => void;
}

/** Create/edit form. Validates in the browser and shows the server's field details as-is. */
export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>(() =>
    project === null ? emptyProjectValues() : projectValuesOf(project),
  );
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const validationErrors = validateProject(values);
    setFieldErrors(validationErrors);
    setFormError(null);
    if (hasProjectErrors(validationErrors)) {
      return;
    }

    setIsSubmitting(true);
    const input = toProjectInput(values);
    try {
      await (project === null ? api.createProject(input) : api.updateProject(project.id, input));
    } catch (error) {
      const { fields, general } = readSubmitErrors(error);
      setFieldErrors(fields);
      setFormError(general);
      setIsSubmitting(false);
      return;
    }
    onSaved();
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {formError !== null && <ErrorState title={COPY.ERROR_TITLE} message={formError} />}
      <TextField
        label={COPY.NAME_LABEL}
        hint={COPY.NAME_HINT}
        error={fieldErrors.name}
        value={values.name}
        aria-required="true"
        autoComplete="off"
        onChange={(event) => {
          setValues((previous) => ({ ...previous, name: event.target.value }));
        }}
      />
      <TextAreaField
        label={COPY.DESCRIPTION_LABEL}
        hint={COPY.DESCRIPTION_HINT}
        error={fieldErrors.description}
        value={values.description}
        onChange={(event) => {
          setValues((previous) => ({ ...previous, description: event.target.value }));
        }}
      />
      <footer className="flex flex-wrap justify-end gap-3">
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onCancel} disabled={isSubmitting}>
          {COPY.CANCEL}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {project === null ? COPY.CREATE : COPY.SAVE}
        </Button>
      </footer>
    </form>
  );
}

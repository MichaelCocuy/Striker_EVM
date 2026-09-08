import { useState } from 'react';

import { api } from '@/api/endpoints';
import { ROLES } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/useAuth';

import {
  ACTIVITY_FIELDS,
  ACTIVITY_LIMITS,
  activityErrorFeedback,
  activityFormValuesFrom,
  buildActivityInput,
  EMPTY_ACTIVITY_FORM_VALUES,
} from './activity-form';
import { OwnerSelect } from './OwnerSelect';
import { useActivityMutation } from './useActivityMutation';

import type { ActivityFieldErrors, ActivityFormField, ActivityFormValues } from './activity-form';
import type { EvmActivityReport } from '@/api/types';
import type { FormEvent } from 'react';

const COPY = {
  CREATE_TITLE: 'Nueva actividad',
  CREATE_DESCRIPTION:
    'Registra el presupuesto, el avance planificado y real, y el costo incurrido. Los indicadores los calcula el servidor.',
  EDIT_TITLE: 'Editar actividad',
  EDIT_DESCRIPTION:
    'Actualiza los datos crudos de la actividad; el reporte EVM se recalcula al guardar.',
  NAME: 'Nombre',
  BUDGET: 'Presupuesto total (BAC)',
  BUDGET_HINT: 'Costo planificado de la actividad al 100 %.',
  PLANNED_PROGRESS: '% de avance planificado',
  ACTUAL_PROGRESS: '% de avance real',
  ACTUAL_COST: 'Costo real (AC)',
  ACTUAL_COST_HINT: 'Dinero ya gastado en la actividad.',
  SUBMIT_CREATE: 'Crear actividad',
  SUBMIT_EDIT: 'Guardar cambios',
  CANCEL: 'Cancelar',
} as const;

const NUMBER_INPUT_MODE = 'decimal';

interface ActivityFormDialogProps {
  projectId: string;
  /** Activity to edit; `undefined` opens the dialog in create mode. */
  activity?: EvmActivityReport | undefined;
  onClose: () => void;
  /** Called after the API confirmed the write, so the caller can refetch the report. */
  onSaved: () => void;
}

/** Create and edit form for an activity. It never derives an EVM indicator. */
export function ActivityFormDialog({
  projectId,
  activity,
  onClose,
  onSaved,
}: ActivityFormDialogProps) {
  const { user } = useAuth();
  const isEditing = activity !== undefined;
  const [values, setValues] = useState<ActivityFormValues>(() =>
    activity === undefined ? EMPTY_ACTIVITY_FORM_VALUES : activityFormValuesFrom(activity),
  );
  const [fieldErrors, setFieldErrors] = useState<ActivityFieldErrors>({});
  const mutation = useActivityMutation();

  const requiresOwner = user?.role === ROLES.REVIEWER;
  const feedback = mutation.error === null ? null : activityErrorFeedback(mutation.error);
  const serverFieldErrors = feedback?.fieldErrors ?? {};
  const generalMessage = feedback?.message ?? null;

  function updateField(field: ActivityFormField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function errorFor(field: ActivityFormField): string | undefined {
    return fieldErrors[field] ?? serverFieldErrors[field];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = buildActivityInput(values, { requiresOwner });
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    await mutation.run(
      () =>
        activity === undefined
          ? api.createActivity(projectId, result.input)
          : api.updateActivity(projectId, activity.id, result.input),
      onSaved,
    );
  }

  return (
    <ModalDialog
      title={isEditing ? COPY.EDIT_TITLE : COPY.CREATE_TITLE}
      description={isEditing ? COPY.EDIT_DESCRIPTION : COPY.CREATE_DESCRIPTION}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {generalMessage !== null && (
          <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
            {generalMessage}
          </p>
        )}

        <TextField
          label={COPY.NAME}
          value={values.name}
          maxLength={ACTIVITY_LIMITS.NAME_MAX_LENGTH}
          error={errorFor(ACTIVITY_FIELDS.NAME)}
          onChange={(event) => updateField(ACTIVITY_FIELDS.NAME, event.target.value)}
        />

        {requiresOwner && (
          <OwnerSelect
            value={values.ownerId}
            error={errorFor(ACTIVITY_FIELDS.OWNER_ID)}
            onChange={(ownerId) => updateField(ACTIVITY_FIELDS.OWNER_ID, ownerId)}
          />
        )}

        <TextField
          label={COPY.BUDGET}
          hint={COPY.BUDGET_HINT}
          inputMode={NUMBER_INPUT_MODE}
          value={values.budgetAtCompletion}
          error={errorFor(ACTIVITY_FIELDS.BUDGET_AT_COMPLETION)}
          onChange={(event) =>
            updateField(ACTIVITY_FIELDS.BUDGET_AT_COMPLETION, event.target.value)
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={COPY.PLANNED_PROGRESS}
            inputMode={NUMBER_INPUT_MODE}
            value={values.plannedProgressPercent}
            error={errorFor(ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT)}
            onChange={(event) =>
              updateField(ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT, event.target.value)
            }
          />
          <TextField
            label={COPY.ACTUAL_PROGRESS}
            inputMode={NUMBER_INPUT_MODE}
            value={values.actualProgressPercent}
            error={errorFor(ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT)}
            onChange={(event) =>
              updateField(ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT, event.target.value)
            }
          />
        </div>

        <TextField
          label={COPY.ACTUAL_COST}
          hint={COPY.ACTUAL_COST_HINT}
          inputMode={NUMBER_INPUT_MODE}
          value={values.actualCost}
          error={errorFor(ACTIVITY_FIELDS.ACTUAL_COST)}
          onChange={(event) => updateField(ACTIVITY_FIELDS.ACTUAL_COST, event.target.value)}
        />

        <footer className="flex flex-wrap justify-end gap-3">
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onClose}>
            {COPY.CANCEL}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? COPY.SUBMIT_EDIT : COPY.SUBMIT_CREATE}
          </Button>
        </footer>
      </form>
    </ModalDialog>
  );
}

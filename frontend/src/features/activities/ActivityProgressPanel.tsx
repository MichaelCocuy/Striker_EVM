import { useId, useState } from 'react';

import { api } from '@/api/endpoints';
import { ROLES } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/useAuth';
import { formatMoney, formatPercent } from '@/lib/format';

import { ACTIVITY_FIELDS, activityErrorFeedback } from './activity-form';
import { ActivityProgressPreview } from './ActivityProgressPreview';
import {
  buildProgressInput,
  draftMeasures,
  PROGRESS_SLIDER,
  progressDraftFrom,
} from './progress-entry';
import { SidePanel } from './SidePanel';
import { useActivityMutation } from './useActivityMutation';

import type { ActivityFieldErrors } from './activity-form';
import type { ProgressDraft } from './progress-entry';
import type { EvmActivityReport } from '@/api/types';
import type { ChangeEvent, FormEvent } from 'react';

const COPY = {
  TITLE: 'Registrar avance',
  SEPARATOR: ' · ',
  CONTEXT:
    'Solo se registran datos crudos: avance real y costo. El cálculo del valor ganado ocurre en el servidor, así que lo que veas abajo es la lectura que quedará en el tablero.',
  PROGRESS_LABEL: 'Avance real (%)',
  PERCENT_SIGN: '%',
  PLANNED_TO_DATE: 'Planificado a la fecha:',
  COST_LABEL: 'Costo real acumulado (AC)',
  COST_HINT: 'Dinero ya gastado en la actividad. Presupuesto total:',
  CANCEL: 'Cancelar',
  SUBMIT: 'Guardar avance',
} as const;

const NUMBER_INPUT_MODE = 'decimal';

/** 18 px is the card rhythm of the design system; the spacing scale has no utility for it. */
const FORM_CLASS = 'flex flex-col gap-[18px]';

interface ActivityProgressPanelProps {
  projectId: string;
  /** Name of the project, for the overline of the panel. */
  projectName: string;
  activity: EvmActivityReport;
  onClose: () => void;
  /** Called after the API confirmed the write, so the caller refetches the report. */
  onSaved: () => void;
}

/**
 * Side panel where a registrar updates the two raw numbers of an activity: real progress and
 * accumulated cost.
 *
 * It previews what it can honestly preview — the drafted progress against the plan — and does
 * not estimate EV, CPI, SPI or EAC: those belong to the server, and duplicating the formula
 * here would duplicate the domain the backend already proves with its own tests.
 */
export function ActivityProgressPanel({
  projectId,
  projectName,
  activity,
  onClose,
  onSaved,
}: ActivityProgressPanelProps) {
  const { user } = useAuth();
  const formId = useId();
  const progressId = useId();
  const plannedId = useId();
  const [draft, setDraft] = useState<ProgressDraft>(() => progressDraftFrom(activity));
  const [fieldErrors, setFieldErrors] = useState<ActivityFieldErrors>({});
  const mutation = useActivityMutation();

  const requiresOwner = user?.role === ROLES.REVIEWER;
  const feedback = mutation.error === null ? null : activityErrorFeedback(mutation.error);
  const generalMessage = feedback?.message ?? null;
  const costError =
    fieldErrors[ACTIVITY_FIELDS.ACTUAL_COST] ?? feedback?.fieldErrors[ACTIVITY_FIELDS.ACTUAL_COST];
  const draftedProgress = draftMeasures(activity, draft).actualProgressPercent;

  function handleProgressChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft((previous) => ({ ...previous, actualProgressPercent: event.target.value }));
  }

  function handleCostChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft((previous) => ({ ...previous, actualCost: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = buildProgressInput(activity, draft, { requiresOwner });
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    await mutation.run(() => api.updateActivity(projectId, activity.id, result.input), onSaved);
  }

  return (
    <SidePanel
      eyebrow={`${projectName}${COPY.SEPARATOR}${activity.name}`}
      title={COPY.TITLE}
      onClose={onClose}
      footer={
        <>
          <Button variant={BUTTON_VARIANT.GHOST} onClick={onClose}>
            {COPY.CANCEL}
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {COPY.SUBMIT}
          </Button>
        </>
      }
    >
      <form id={formId} className={FORM_CLASS} onSubmit={handleSubmit} noValidate>
        {generalMessage !== null && (
          <p role="alert" className="rounded-md bg-danger-soft p-4 text-small text-danger">
            {generalMessage}
          </p>
        )}

        <p className="rounded-md bg-accent-soft p-4 text-small text-ink">{COPY.CONTEXT}</p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={progressId}
            className="font-heading text-caption font-semibold text-ink-muted"
          >
            {COPY.PROGRESS_LABEL}
          </label>
          <input
            id={progressId}
            type="range"
            min={PROGRESS_SLIDER.MIN}
            max={PROGRESS_SLIDER.MAX}
            step={PROGRESS_SLIDER.STEP}
            value={draft.actualProgressPercent}
            onChange={handleProgressChange}
            aria-describedby={plannedId}
            className="w-full accent-accent-bright"
          />
          <div className="flex items-baseline gap-2">
            <span className="numeric text-figure-xl text-ink">{draftedProgress}</span>
            <span className="font-heading text-body font-semibold text-ink-subtle">
              {COPY.PERCENT_SIGN}
            </span>
            <span id={plannedId} className="ml-auto text-caption text-ink-subtle">
              {`${COPY.PLANNED_TO_DATE} ${formatPercent(activity.input.plannedProgressPercent)}`}
            </span>
          </div>
        </div>

        <TextField
          label={COPY.COST_LABEL}
          hint={`${COPY.COST_HINT} ${formatMoney(activity.indicators.budgetAtCompletion)}`}
          inputMode={NUMBER_INPUT_MODE}
          value={draft.actualCost}
          error={costError}
          onChange={handleCostChange}
        />

        <ActivityProgressPreview activity={activity} draft={draft} />
      </form>
    </SidePanel>
  );
}

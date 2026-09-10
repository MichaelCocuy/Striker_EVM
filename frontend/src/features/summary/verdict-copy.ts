/**
 * Wording of the conclusion the reading band opens with (handoff §3.1, cell 1).
 *
 * The sentence is chosen by looking it up with the pair of statuses the report brings
 * (`costStatus` × `scheduleStatus`), which is the whole point of the exercise: the reader
 * gets the answer in plain Spanish before parsing a number. Nothing here calculates — the
 * report already decided both traffic lights (docs/EVM_GUIA.md §3).
 */

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';

import type { CostStatus, ScheduleStatus } from '@/api/types';
import type { SignReading } from '@/features/evm-report/indicator-copy';

/** How the pair of traffic lights reads as a whole. */
export const VERDICT_LEVEL = {
  GOOD: 'GOOD',
  ON_PLAN: 'ON_PLAN',
  /** One light is green and the other is red: the good news is not what it seems. */
  WARNING: 'WARNING',
  BAD: 'BAD',
  /** One of the two questions has no answer yet, so the verdict is half an answer. */
  PARTIAL: 'PARTIAL',
  UNKNOWN: 'UNKNOWN',
} as const;

export type VerdictLevel = (typeof VERDICT_LEVEL)[keyof typeof VERDICT_LEVEL];

/**
 * How the whole reading reads in two words. It is never more optimistic than the worst of
 * the two traffic lights: a mixed case reads as a warning, because in this app amber
 * already means "en meta" (ARQUITECTURA §12) and would pass for good news.
 */
export const VERDICT_LEVEL_LABEL: Record<VerdictLevel, string> = {
  [VERDICT_LEVEL.GOOD]: 'Va bien',
  [VERDICT_LEVEL.ON_PLAN]: 'Va según el plan',
  [VERDICT_LEVEL.WARNING]: 'Atención',
  [VERDICT_LEVEL.BAD]: 'Va mal',
  [VERDICT_LEVEL.PARTIAL]: 'Respuesta parcial',
  [VERDICT_LEVEL.UNKNOWN]: 'Sin datos',
};

/** The verdict of one combination of statuses: how it reads and what it says. */
export interface StatusPairVerdict {
  level: VerdictLevel;
  headline: string;
}

/**
 * The verdict for every combination of cost and schedule status.
 *
 * The mixed combinations are the reason this is a table and not a chain of conditions:
 * a saving with a delay is a warning, never good news, because the money was saved by not
 * doing the work (docs/EVM_GUIA.md §9, "Rediseño del intranet").
 */
export const VERDICT_BY_STATUS: Record<CostStatus, Record<ScheduleStatus, StatusPairVerdict>> = {
  [COST_STATUS.UNDER_BUDGET]: {
    [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: {
      level: VERDICT_LEVEL.GOOD,
      headline: 'Este proyecto va bien: está adelantado y por debajo del presupuesto.',
    },
    [SCHEDULE_STATUS.ON_SCHEDULE]: {
      level: VERDICT_LEVEL.GOOD,
      headline: 'Este proyecto va bien: cumple el cronograma y gasta menos de lo presupuestado.',
    },
    [SCHEDULE_STATUS.BEHIND_SCHEDULE]: {
      level: VERDICT_LEVEL.WARNING,
      headline:
        'Cuidado: el proyecto está bajo presupuesto pero atrasado; el ahorro viene del trabajo que no se ha hecho, no de la eficiencia.',
    },
    [SCHEDULE_STATUS.NOT_APPLICABLE]: {
      level: VERDICT_LEVEL.PARTIAL,
      headline:
        'El proyecto gasta menos de lo presupuestado, pero su cronograma todavía no se puede evaluar.',
    },
  },
  [COST_STATUS.ON_BUDGET]: {
    [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: {
      level: VERDICT_LEVEL.GOOD,
      headline: 'Este proyecto va bien: está adelantado y gasta lo presupuestado.',
    },
    [SCHEDULE_STATUS.ON_SCHEDULE]: {
      level: VERDICT_LEVEL.ON_PLAN,
      headline: 'Este proyecto va según el plan: al día en cronograma y en presupuesto.',
    },
    [SCHEDULE_STATUS.BEHIND_SCHEDULE]: {
      level: VERDICT_LEVEL.BAD,
      headline: 'Este proyecto va mal: está atrasado, aunque cada peso gastado rinda lo previsto.',
    },
    [SCHEDULE_STATUS.NOT_APPLICABLE]: {
      level: VERDICT_LEVEL.PARTIAL,
      headline:
        'El proyecto gasta lo presupuestado, pero su cronograma todavía no se puede evaluar.',
    },
  },
  [COST_STATUS.OVER_BUDGET]: {
    [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: {
      level: VERDICT_LEVEL.WARNING,
      headline:
        'Cuidado: el proyecto está adelantado pero sobre presupuesto; avanza rápido pagando más de lo que vale el trabajo hecho.',
    },
    [SCHEDULE_STATUS.ON_SCHEDULE]: {
      level: VERDICT_LEVEL.BAD,
      headline:
        'Este proyecto va mal: está sobre presupuesto; cumple el cronograma pero paga más de lo que vale el trabajo hecho.',
    },
    [SCHEDULE_STATUS.BEHIND_SCHEDULE]: {
      level: VERDICT_LEVEL.BAD,
      headline: 'Gasta más de lo que avanza, y el atraso es lo que empuja el sobrecosto.',
    },
    [SCHEDULE_STATUS.NOT_APPLICABLE]: {
      level: VERDICT_LEVEL.BAD,
      headline:
        'Este proyecto va mal en costo: está sobre presupuesto y su cronograma todavía no se puede evaluar.',
    },
  },
  [COST_STATUS.NOT_APPLICABLE]: {
    [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: {
      level: VERDICT_LEVEL.PARTIAL,
      headline:
        'El proyecto está adelantado, pero sin costos registrados no se puede opinar sobre el gasto.',
    },
    [SCHEDULE_STATUS.ON_SCHEDULE]: {
      level: VERDICT_LEVEL.PARTIAL,
      headline:
        'El proyecto cumple el cronograma, pero sin costos registrados no se puede opinar sobre el gasto.',
    },
    [SCHEDULE_STATUS.BEHIND_SCHEDULE]: {
      level: VERDICT_LEVEL.BAD,
      headline:
        'Este proyecto va mal: está atrasado y todavía no hay costos registrados con los que juzgar el gasto.',
    },
    [SCHEDULE_STATUS.NOT_APPLICABLE]: {
      level: VERDICT_LEVEL.UNKNOWN,
      headline:
        'Todavía no se puede juzgar este proyecto: con los datos de hoy no hay costo ni cronograma que evaluar.',
    },
  },
};

/** What the band says when the report has nothing to evaluate (docs/EVM_GUIA.md §5.5). */
export const EMPTY_READING_COPY = {
  HEADING: 'Todavía no hay nada que evaluar',
  BODY: 'El proyecto no tiene actividades registradas: no hay plan, ni avance, ni costo que comparar. Al registrar la primera actividad aparecerán la lectura del corte, las desviaciones y el pronóstico.',
} as const;

/** Why the closing cost is not projectable, when the report could not compute the EAC. */
export const FORECAST_REASON_COPY = {
  NO_COST: 'Todavía no hay costos registrados, así que no se puede proyectar en cuánto terminará.',
  NO_PROGRESS: 'Con el avance real en cero no hay eficiencia con la que proyectar el cierre.',
  NOT_COMPUTABLE: 'Con los datos de hoy el pronóstico al cierre no es calculable.',
} as const;

/** How the variance at completion reads next to its figure in the forecast cell. */
export const COMPLETION_VARIANCE_SHORT_READING = {
  POSITIVE: 'por debajo del presupuesto',
  ZERO: 'justo en el presupuesto',
  NEGATIVE: 'por encima del presupuesto',
} as const satisfies SignReading;

/** Notes the report attaches when an indicator does not apply. */
export const NOTES_HEADING = 'Notas del cálculo';

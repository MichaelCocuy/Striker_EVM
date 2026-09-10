/**
 * Wording of the verdict band (module M9).
 *
 * The band answers "¿cómo va el proyecto?" in one sentence before the reader parses a
 * number, so every sentence lives here as a constant and is chosen by looking it up with
 * the pair of statuses the report brings (`costStatus` × `scheduleStatus`). Nothing here
 * calculates: the report already decided both traffic lights (docs/EVM_GUIA.md §3).
 */

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { EVM_TONE } from '@/evm/tone';

import type { SignReading } from './summary-copy';
import type { CostStatus, ScheduleStatus } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

export const VERDICT_COPY = {
  EYEBROW: 'Veredicto',
  TITLE: '¿Cómo va el proyecto?',
  DESCRIPTION: 'La respuesta en una línea, antes de cualquier número.',
  ANSWERS_HEADING: 'Las tres respuestas',
  ANSWERS_HINT:
    'Costo, cronograma y cierre: cada pregunta con el indicador que la responde y la desviación en dinero que la respalda.',
  COST_QUESTION: '¿Cómo vamos en costo?',
  SCHEDULE_QUESTION: '¿Cómo vamos en cronograma?',
  FORECAST_QUESTION: '¿En cuánto va a terminar?',
  LOADING_LABEL: 'Leyendo el estado del proyecto…',
} as const;

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

export const VERDICT_LEVEL_LABEL: Record<VerdictLevel, string> = {
  [VERDICT_LEVEL.GOOD]: 'Va bien',
  [VERDICT_LEVEL.ON_PLAN]: 'Va según el plan',
  [VERDICT_LEVEL.WARNING]: 'Atención',
  [VERDICT_LEVEL.BAD]: 'Va mal',
  [VERDICT_LEVEL.PARTIAL]: 'Respuesta parcial',
  [VERDICT_LEVEL.UNKNOWN]: 'Sin datos',
};

/**
 * Tone of the whole band. It is never more optimistic than the worst of the two traffic
 * lights: a mixed case paints red, because in this app amber already means "en meta"
 * (ARQUITECTURA §12) and would read as good news.
 */
export const VERDICT_LEVEL_TONE: Record<VerdictLevel, EvmTone> = {
  [VERDICT_LEVEL.GOOD]: EVM_TONE.GOOD,
  [VERDICT_LEVEL.ON_PLAN]: EVM_TONE.NEUTRAL,
  [VERDICT_LEVEL.WARNING]: EVM_TONE.BAD,
  [VERDICT_LEVEL.BAD]: EVM_TONE.BAD,
  [VERDICT_LEVEL.PARTIAL]: EVM_TONE.NA,
  [VERDICT_LEVEL.UNKNOWN]: EVM_TONE.NA,
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
      headline:
        'Este proyecto va mal: está atrasado y sobre presupuesto; gasta más de lo que avanza.',
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

/** Second line of the band: what the verdict costs, or why the closing cost is not computable. */
export const CONSEQUENCE_COPY = {
  FORECAST_LEAD: 'Si sigue así terminará costando',
  INSTEAD_OF: 'en vez de',
  BUDGET_REFERENCE: 'frente a un presupuesto de',
  NO_COST_REASON:
    'Todavía no hay costos registrados, así que no se puede proyectar en cuánto terminará.',
  NO_PROGRESS_REASON:
    'Con el avance real en cero no hay eficiencia con la que proyectar el cierre.',
  NOT_COMPUTABLE_REASON: 'Con los datos de hoy el pronóstico al cierre no es calculable.',
} as const;

/** Short readings used inside the answer tiles, where the figure carries its own label. */
export const COST_VARIANCE_SHORT_READING = {
  POSITIVE: 'ahorro',
  ZERO: 'sin desviación',
  NEGATIVE: 'sobrecosto',
} as const satisfies SignReading;

export const SCHEDULE_VARIANCE_SHORT_READING = {
  POSITIVE: 'adelanto',
  ZERO: 'sin desviación',
  NEGATIVE: 'atraso',
} as const satisfies SignReading;

export const COMPLETION_VARIANCE_SHORT_READING = {
  POSITIVE: 'por debajo del presupuesto',
  ZERO: 'justo en el presupuesto',
  NEGATIVE: 'por encima del presupuesto',
} as const satisfies SignReading;

/** How the gap against the budget reads inside the consequence sentence. */
export const COMPLETION_GAP_READING = {
  POSITIVE: 'por debajo',
  ZERO: 'justo en el presupuesto',
  NEGATIVE: 'por encima',
} as const satisfies SignReading;

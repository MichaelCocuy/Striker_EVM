/**
 * Vocabulary of the EVM report, shared by every reader of it (the reading band and the four
 * charts of the dashboard).
 *
 * Each indicator carries its acronym, its Spanish name and the question it answers, taken
 * from docs/EVM_GUIA.md §3, so a figure is never shown without its meaning — and so the
 * hidden table beside every graphic reads as prose to a screen reader. Nothing here
 * calculates: the report brings the numbers already computed.
 */

/** Acronym, Spanish name and the question the indicator answers. */
export interface IndicatorMeta {
  acronym: string;
  name: string;
  help: string;
}

export const INDICATORS = {
  PLANNED_VALUE: {
    acronym: 'PV',
    name: 'Valor planificado',
    help: '¿Cuánto trabajo debería estar hecho hoy según el cronograma, expresado en dinero?',
  },
  EARNED_VALUE: {
    acronym: 'EV',
    name: 'Valor ganado',
    help: '¿Cuánto trabajo está hecho de verdad, valorado con el dinero del presupuesto?',
  },
  ACTUAL_COST: {
    acronym: 'AC',
    name: 'Costo real',
    help: '¿Cuánto dinero ha salido realmente hasta hoy, según la contabilidad?',
  },
  BUDGET_AT_COMPLETION: {
    acronym: 'BAC',
    name: 'Presupuesto total',
    help: '¿Cuánto debería costar el proyecto completo, al 100 % del trabajo?',
  },
  COST_VARIANCE: {
    acronym: 'CV',
    name: 'Varianza de costo',
    help: '¿Lo que se hizo vale más o menos de lo que se pagó por él?',
  },
  SCHEDULE_VARIANCE: {
    acronym: 'SV',
    name: 'Varianza del cronograma',
    help: '¿Se hizo más o menos trabajo del que correspondía a hoy?',
  },
  COST_PERFORMANCE_INDEX: {
    acronym: 'CPI',
    name: 'Índice de desempeño del costo',
    help: '¿Cuánto valor se recibe por cada peso que se gasta?',
  },
  SCHEDULE_PERFORMANCE_INDEX: {
    acronym: 'SPI',
    name: 'Índice de desempeño del cronograma',
    help: '¿A qué ritmo avanza el proyecto respecto al plan?',
  },
  ESTIMATE_AT_COMPLETION: {
    acronym: 'EAC',
    name: 'Estimación al terminar',
    help: 'Si se mantiene esta eficiencia, ¿cuánto costará terminar todo el trabajo?',
  },
  VARIANCE_AT_COMPLETION: {
    acronym: 'VAC',
    name: 'Varianza al terminar',
    help: '¿Cuánto se desviará el proyecto de su presupuesto cuando cierre?',
  },
} as const satisfies Record<string, IndicatorMeta>;

/** Wording for each possible sign of a reported figure (docs/EVM_GUIA.md §3). */
export interface SignReading {
  POSITIVE: string;
  ZERO: string;
  NEGATIVE: string;
}

export const COST_VARIANCE_READING = {
  POSITIVE: 'Favorable: lo hecho vale más de lo pagado',
  ZERO: 'Exacto: lo hecho vale lo pagado',
  NEGATIVE: 'Desfavorable: se pagó más de lo que vale lo hecho',
} as const satisfies SignReading;

export const SCHEDULE_VARIANCE_READING = {
  POSITIVE: 'Favorable: se hizo más trabajo del previsto a hoy',
  ZERO: 'Exacto: se hizo justo el trabajo previsto a hoy',
  NEGATIVE: 'Desfavorable: se hizo menos trabajo del previsto a hoy',
} as const satisfies SignReading;

export const COMPLETION_VARIANCE_READING = {
  POSITIVE: 'Favorable: terminará por debajo del presupuesto',
  ZERO: 'Exacto: terminará justo en el presupuesto',
  NEGATIVE: 'Desfavorable: terminará por encima del presupuesto',
} as const satisfies SignReading;

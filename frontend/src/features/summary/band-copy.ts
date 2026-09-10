/**
 * Wording of the reading band (handoff §3.1).
 *
 * The band answers "¿cómo va el proyecto?" in one sentence before the reader parses a
 * number. Every string lives here; the sentence itself is looked up in `verdict-copy.ts`
 * with the pair of statuses the report brings. Nothing here calculates.
 */

export const BAND_COPY = {
  OVERLINE: 'Lectura del corte',
  /** Accessible name of the band, which is a region and not a card. */
  REGION_LABEL: 'Lectura del corte del proyecto',
  /** Accessible name of the hidden list that carries the band's figures as text. */
  INDICATORS_LABEL: 'Indicadores del corte',
  FORECAST_HEADING: 'Pronóstico al cierre',
  LOADING_LABEL: 'Leyendo el estado del proyecto…',
} as const;

/** Overline under each gauge: the acronym next to the status the report already decided. */
export const BAND_LABEL_SEPARATOR = ' · ';

/** Overlines of the forecast cell, in the form the handoff spells them out. */
export const FORECAST_LABEL = {
  ESTIMATE_AT_COMPLETION: 'EAC · costo al terminar',
  VARIANCE_AT_COMPLETION: 'VAC · desviación al cierre',
} as const;

/**
 * Second line of the conclusion cell: which activity carries the deviation at closing and
 * how much of the budget it weighs. Both figures come from the report; the share is the
 * ratio the handoff sanctions in §3.6.
 */
export const DEVIATION_FOCUS_COPY = {
  ONLY_ADVERSE: (name: string, share: string) =>
    `${name} es la única actividad que cerrará por encima de su presupuesto: concentra toda la desviación y pesa el ${share} del presupuesto total.`,
  WORST: (name: string, share: string) =>
    `${name} concentra la mayor desviación al cierre y pesa el ${share} del presupuesto total.`,
  NONE: 'Ninguna actividad cerrará por encima de su presupuesto: la desviación no está concentrada en una sola.',
  NOT_COMPUTABLE: 'Todavía no hay desviación al cierre calculable por actividad.',
} as const;

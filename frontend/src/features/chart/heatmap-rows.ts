import {
  COST_STATUS_LABEL,
  costStatusTone,
  EVM_TONE_TOKENS,
  SCHEDULE_STATUS_LABEL,
  scheduleStatusTone,
} from '@/evm/tone';
import { budgetSharePercent } from '@/features/evm-report/budget-share';
import { COMPLETION_VARIANCE_READING, INDICATORS } from '@/features/evm-report/indicator-copy';
import { readSign } from '@/features/evm-report/report-reading';
import { formatPercent, NOT_COMPUTABLE } from '@/lib/format';

import { CHART_FURNITURE_TOKEN } from './chart-config';
import { formatHeatmapIndex, formatSignedAmount } from './chart-format';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Cell model of the risk heat map (handoff §3.6): one row per activity, one column per thing
 * that can go wrong, so the reviewer can decide where to intervene first.
 *
 * Contract: the two indices, the variance at completion and both budgets come from the
 * report. The weight is the share of the project budget the activity carries — the one ratio
 * the handoff sanctions in the client, arithmetic of presentation over two reported figures.
 */

/** An activity that carries more than half the budget is the only one that moves the total. */
const HEAVY_WEIGHT_PERCENT = 50;

export const HEATMAP_COPY = {
  COLUMNS: {
    ACTIVITY: 'Actividad',
    COST: 'Costo',
    SCHEDULE: 'Plazo',
    CLOSING: 'Cierre',
    WEIGHT: 'Peso',
  },
  CAPTION: 'Riesgo por actividad y dimensión',
  FOOTNOTE:
    'Peso = participación de la actividad en el presupuesto total. Un rojo con peso alto es lo único que mueve el consolidado.',
  WEIGHT_READING: 'Participación en el presupuesto total',
  HEAVY_WEIGHT_READING: 'Concentra más de la mitad del presupuesto total',
  EMPTY: 'Agrega una actividad para ver el mapa de calor.',
} as const;

/** What each column measures, so the header is not just an adjective. */
export const HEATMAP_COLUMN_INDICATOR = {
  COST: INDICATORS.COST_PERFORMANCE_INDEX,
  SCHEDULE: INDICATORS.SCHEDULE_PERFORMANCE_INDEX,
  CLOSING: INDICATORS.VARIANCE_AT_COMPLETION,
  WEIGHT: INDICATORS.BUDGET_AT_COMPLETION,
} as const;

export interface HeatmapCell {
  key: string;
  /** The figure as it is written in the cell. */
  text: string;
  /** The same cell in words, so colour is never the only carrier of meaning. */
  reading: string;
  backgroundToken: string;
  inkToken: string;
}

export interface HeatmapRow {
  id: string;
  name: string;
  cells: HeatmapCell[];
}

function toneCell(key: string, text: string, reading: string, tone: EvmTone): HeatmapCell {
  const { colorToken, softColorToken } = EVM_TONE_TOKENS[tone];
  return { key, text, reading, backgroundToken: softColorToken, inkToken: colorToken };
}

/** The weight column is deliberately neutral: it is a size, not a verdict. */
function weightCell(activityBudget: number, projectBudget: number): HeatmapCell {
  const share = budgetSharePercent(activityBudget, projectBudget);
  const isHeavy = share !== null && share > HEAVY_WEIGHT_PERCENT;
  return {
    key: HEATMAP_COPY.COLUMNS.WEIGHT,
    text: share === null ? NOT_COMPUTABLE : formatPercent(share),
    reading: isHeavy ? HEATMAP_COPY.HEAVY_WEIGHT_READING : HEATMAP_COPY.WEIGHT_READING,
    backgroundToken: isHeavy ? CHART_FURNITURE_TOKEN.AXIS : CHART_FURNITURE_TOKEN.GRID,
    inkToken: isHeavy ? CHART_FURNITURE_TOKEN.NAME_INK : CHART_FURNITURE_TOKEN.GLOSS_INK,
  };
}

export function toHeatmapRows(
  activities: readonly EvmActivityReport[],
  project: EvmIndicators,
): HeatmapRow[] {
  return activities.map((activity) => {
    const { indicators } = activity;
    const closing = readSign(indicators.varianceAtCompletion, COMPLETION_VARIANCE_READING);

    return {
      id: activity.id,
      name: activity.name,
      cells: [
        toneCell(
          HEATMAP_COPY.COLUMNS.COST,
          formatHeatmapIndex(indicators.costPerformanceIndex),
          COST_STATUS_LABEL[indicators.costStatus],
          costStatusTone(indicators.costStatus),
        ),
        toneCell(
          HEATMAP_COPY.COLUMNS.SCHEDULE,
          formatHeatmapIndex(indicators.schedulePerformanceIndex),
          SCHEDULE_STATUS_LABEL[indicators.scheduleStatus],
          scheduleStatusTone(indicators.scheduleStatus),
        ),
        toneCell(
          HEATMAP_COPY.COLUMNS.CLOSING,
          formatSignedAmount(indicators.varianceAtCompletion),
          closing.label,
          closing.tone,
        ),
        weightCell(indicators.budgetAtCompletion, project.budgetAtCompletion),
      ],
    };
  });
}

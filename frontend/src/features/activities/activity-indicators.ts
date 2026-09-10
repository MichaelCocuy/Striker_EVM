import { formatIndex, formatMoney } from '@/lib/format';

import { ACTIVITY_INDEX_COLUMNS, ACTIVITY_INDEX_STATUS } from './activity-index';

import type {
  ActivityIndexDescriptor,
  ActivityIndexStatus,
  NumericIndicatorKey,
} from './activity-index';
import type { EvmIndicators } from '@/api/types';

/** How a reported number is presented: money right-aligned, or an index inside a toned chip. */
export const INDICATOR_KIND = {
  MONEY: 'money',
  INDEX: 'index',
} as const;

export type IndicatorKind = (typeof INDICATOR_KIND)[keyof typeof INDICATOR_KIND];

export interface MoneyIndicator {
  kind: typeof INDICATOR_KIND.MONEY;
  key: NumericIndicatorKey;
  /** Short name, as EVM_GUIA.md names the indicator. */
  label: string;
  /** Expanded name plus the question it answers (EVM_GUIA.md §3). */
  description: string;
  /** Traffic light this figure wears, for the few money figures that carry one. */
  statusKey?: ActivityIndexStatus;
}

export interface IndexIndicator extends ActivityIndexDescriptor {
  kind: typeof INDICATOR_KIND.INDEX;
}

export type IndicatorDescriptor = MoneyIndicator | IndexIndicator;

const BUDGET_AT_COMPLETION: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'budgetAtCompletion',
  label: 'BAC',
  description: 'Presupuesto total: costo planificado de la actividad al 100 %',
};

const PLANNED_VALUE: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'plannedValue',
  label: 'PV',
  description: 'Valor planificado: cuánto trabajo debería estar hecho a la fecha',
};

const EARNED_VALUE: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'earnedValue',
  label: 'EV',
  description: 'Valor ganado: cuánto vale el trabajo ejecutado a la fecha',
};

const ACTUAL_COST: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'actualCost',
  label: 'AC',
  description: 'Costo real: cuánto se ha pagado a la fecha',
};

const COST_VARIANCE: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'costVariance',
  label: 'CV',
  description: 'Variación del costo (EV − AC): positivo es ahorro',
};

const SCHEDULE_VARIANCE: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'scheduleVariance',
  label: 'SV',
  description: 'Variación del cronograma (EV − PV): positivo es adelanto',
};

const ESTIMATE_AT_COMPLETION: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'estimateAtCompletion',
  label: 'EAC',
  description: 'Costo estimado al terminar (BAC / CPI): con la eficiencia actual',
  statusKey: ACTIVITY_INDEX_STATUS.COST,
};

const VARIANCE_AT_COMPLETION: MoneyIndicator = {
  kind: INDICATOR_KIND.MONEY,
  key: 'varianceAtCompletion',
  label: 'VAC',
  description: 'Variación al terminar (BAC − EAC): cuánto sobra o falta al cerrar',
};

const INDEX_INDICATORS: readonly IndexIndicator[] = ACTIVITY_INDEX_COLUMNS.map((index) => ({
  ...index,
  kind: INDICATOR_KIND.INDEX,
}));

/**
 * Indicator columns of the nine-column table row: the value earned, what it cost, both
 * indices and the forecast. BAC, PV, CV, SV and VAC left the table in the redesign; they are
 * in the activity detail, which is where an exact figure is looked up.
 */
export const TABLE_INDICATORS: readonly IndicatorDescriptor[] = [
  EARNED_VALUE,
  ACTUAL_COST,
  ...INDEX_INDICATORS,
  ESTIMATE_AT_COMPLETION,
];

/** The ten indicators of the report, in the reading order of EVM_GUIA.md. */
export const DETAIL_INDICATORS: readonly IndicatorDescriptor[] = [
  BUDGET_AT_COMPLETION,
  PLANNED_VALUE,
  EARNED_VALUE,
  ACTUAL_COST,
  COST_VARIANCE,
  SCHEDULE_VARIANCE,
  ...INDEX_INDICATORS,
  ESTIMATE_AT_COMPLETION,
  VARIANCE_AT_COMPLETION,
];

/**
 * The four tiles of the detail: what was planned, what was earned, what it cost and where it
 * lands.
 */
export const DETAIL_TILE_INDICATORS: readonly IndicatorDescriptor[] = [
  PLANNED_VALUE,
  EARNED_VALUE,
  ACTUAL_COST,
  ESTIMATE_AT_COMPLETION,
];

/** The four tiles of the entry panel: the reading the activity has right now. */
export const PREVIEW_TILE_INDICATORS: readonly IndicatorDescriptor[] = [
  EARNED_VALUE,
  ...INDEX_INDICATORS,
  ESTIMATE_AT_COMPLETION,
];

/** Money with two decimals, an index with four, and `—` when the report sends `null`. */
export function indicatorValue(indicator: IndicatorDescriptor, indicators: EvmIndicators): string {
  return indicator.kind === INDICATOR_KIND.INDEX
    ? formatIndex(indicators[indicator.key])
    : formatMoney(indicators[indicator.key]);
}

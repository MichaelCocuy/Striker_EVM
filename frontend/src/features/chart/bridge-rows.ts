import { EVM_TONE_TOKENS } from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { readSign } from '@/features/evm-report/report-reading';
import { formatNumber } from '@/lib/format';

import {
  BRIDGE,
  bridgeAnchorTop,
  bridgeColumnCenter,
  bridgeColumnRight,
  bridgeColumnX,
} from './bridge-geometry';
import { SERIES_FILL_TOKEN, SERIES_INK_TOKEN, SERIES_KEYS } from './chart-config';
import { formatSignedAmount } from './chart-format';

import type { SeriesKey } from './chart-config';
import type { EvmIndicators } from '@/api/types';
import type { IndicatorMeta, SignReading } from '@/features/evm-report/indicator-copy';
import type { FigureReading } from '@/features/evm-report/report-reading';

/**
 * Column model of the variance bridge (handoff §3.3): a waterfall that decomposes the
 * distance between what was planned and what was paid into the two jumps the report already
 * measured — the work not done (SV) and what was overpaid for the work that was done (CV).
 *
 * Contract: both jumps are `scheduleVariance` and `costVariance` as the report brings them.
 * Reading the sign of a reported variance to choose its ink and its wording is presentation;
 * nothing is derived here.
 */

/** Figures on the bridge are read in whole units; the exact cents live in the strip below. */
const BRIDGE_FIGURE_DECIMALS = 0;

/** Glosses under each column, in the words the handoff writes them. */
const ANCHOR_GLOSS = {
  PLANNED: 'planificado',
  EARNED: 'trabajo hecho',
  ACTUAL: 'gastado',
} as const;

const SCHEDULE_JUMP_GLOSS = {
  POSITIVE: 'trabajo adelantado',
  ZERO: 'sin atraso',
  NEGATIVE: 'trabajo no hecho',
} as const satisfies SignReading;

const COST_JUMP_GLOSS = {
  POSITIVE: 'ahorro',
  ZERO: 'sin sobrecosto',
  NEGATIVE: 'sobrecosto',
} as const satisfies SignReading;

export interface BridgeColumn {
  meta: IndicatorMeta;
  /** Money as the report brings it. */
  value: number;
  /** The figure as it is written above the bar. */
  figure: string;
  /** One word under the acronym saying what the column is. */
  gloss: string;
  /** How the sign reads; only a jump has one, an anchor has no direction of its own. */
  reading: FigureReading | null;
  x: number;
  /** Centre of the column, where its figure and labels are anchored. */
  centerX: number;
  y: number;
  height: number;
  fillToken: string;
  inkToken: string;
}

export interface BridgeConnector {
  x1: number;
  x2: number;
  y: number;
}

export interface BridgeModel {
  columns: BridgeColumn[];
  connectors: BridgeConnector[];
}

const COLUMN_INDEX = {
  PLANNED_VALUE: 0,
  SCHEDULE_VARIANCE: 1,
  EARNED_VALUE: 2,
  COST_VARIANCE: 3,
  ACTUAL_COST: 4,
} as const;

/** The tallest anchor sets the scale; the two jumps are differences between anchors. */
export function bridgeScale(indicators: EvmIndicators): number {
  return Math.max(indicators.plannedValue, indicators.earnedValue, indicators.actualCost);
}

function anchorColumn(
  meta: IndicatorMeta,
  value: number,
  gloss: string,
  index: number,
  seriesKey: SeriesKey,
  scale: number,
): BridgeColumn {
  const top = bridgeAnchorTop(value, scale);
  return {
    meta,
    value,
    figure: formatNumber(value, BRIDGE_FIGURE_DECIMALS),
    gloss,
    reading: null,
    x: bridgeColumnX(index),
    centerX: bridgeColumnCenter(index),
    y: top,
    height: BRIDGE.BASELINE_Y - top,
    fillToken: SERIES_FILL_TOKEN[seriesKey],
    inkToken: SERIES_INK_TOKEN[seriesKey],
  };
}

/**
 * A jump floats between the two anchors it separates: an unfavourable cost variance rises
 * from the level of EV to the level of AC, and a favourable one drops instead.
 */
function jumpColumn(
  meta: IndicatorMeta,
  value: number,
  wording: SignReading,
  index: number,
  fromTop: number,
  toTop: number,
): BridgeColumn {
  const reading = readSign(value, wording);
  const { colorToken } = EVM_TONE_TOKENS[reading.tone];
  return {
    meta,
    value,
    figure: formatSignedAmount(value),
    gloss: reading.label,
    reading,
    x: bridgeColumnX(index),
    centerX: bridgeColumnCenter(index),
    y: Math.min(fromTop, toTop),
    height: Math.abs(toTop - fromTop),
    fillToken: colorToken,
    inkToken: colorToken,
  };
}

export function toBridgeModel(indicators: EvmIndicators): BridgeModel {
  const scale = bridgeScale(indicators);
  const plannedTop = bridgeAnchorTop(indicators.plannedValue, scale);
  const earnedTop = bridgeAnchorTop(indicators.earnedValue, scale);
  const actualTop = bridgeAnchorTop(indicators.actualCost, scale);

  const columns: BridgeColumn[] = [
    anchorColumn(
      INDICATORS.PLANNED_VALUE,
      indicators.plannedValue,
      ANCHOR_GLOSS.PLANNED,
      COLUMN_INDEX.PLANNED_VALUE,
      SERIES_KEYS.PLANNED_VALUE,
      scale,
    ),
    jumpColumn(
      INDICATORS.SCHEDULE_VARIANCE,
      indicators.scheduleVariance,
      SCHEDULE_JUMP_GLOSS,
      COLUMN_INDEX.SCHEDULE_VARIANCE,
      plannedTop,
      earnedTop,
    ),
    anchorColumn(
      INDICATORS.EARNED_VALUE,
      indicators.earnedValue,
      ANCHOR_GLOSS.EARNED,
      COLUMN_INDEX.EARNED_VALUE,
      SERIES_KEYS.EARNED_VALUE,
      scale,
    ),
    jumpColumn(
      INDICATORS.COST_VARIANCE,
      indicators.costVariance,
      COST_JUMP_GLOSS,
      COLUMN_INDEX.COST_VARIANCE,
      earnedTop,
      actualTop,
    ),
    anchorColumn(
      INDICATORS.ACTUAL_COST,
      indicators.actualCost,
      ANCHOR_GLOSS.ACTUAL,
      COLUMN_INDEX.ACTUAL_COST,
      SERIES_KEYS.ACTUAL_COST,
      scale,
    ),
  ];

  /** Each dashed line joins two columns at the level they share. */
  const connectorLevels = [plannedTop, earnedTop, earnedTop, actualTop];
  const connectors = connectorLevels.map((y, index) => ({
    x1: bridgeColumnRight(index),
    x2: bridgeColumnX(index + 1),
    y,
  }));

  return { columns, connectors };
}

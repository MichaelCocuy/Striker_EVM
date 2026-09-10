/**
 * Chart-only formatting. Money and index values keep coming from `lib/format.ts`; this file
 * adds only what an axis, a bar label and a heat map cell need.
 */

import { formatNumber, LOCALE, NOT_COMPUTABLE } from '@/lib/format';

const COMPACT_MAX_FRACTION_DIGITS = 1;
const WHOLE_UNITS = 0;
const ELLIPSIS = '…';

/** Two decimals: a heat map cell reads the trend of an index, not its fourth decimal. */
export const HEATMAP_INDEX_DECIMALS = 2;

const compactMoneyFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  /** Spanish words ("40 mil") read better on an axis than the abbreviations ("40 k"). */
  compactDisplay: 'long',
  maximumFractionDigits: COMPACT_MAX_FRACTION_DIGITS,
});

const signedAmountFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: WHOLE_UNITS,
  /** A variance is read by its direction first, so the plus sign is written out. */
  signDisplay: 'exceptZero',
});

/** Axis ticks and bubble labels are compact ("40 mil") so the scale fits a narrow column. */
export function formatCompactMoney(value: number): string {
  return compactMoneyFormatter.format(value);
}

/** Whole units with an explicit sign ("−10.000"); `null` becomes the not-computable mark. */
export function formatSignedAmount(value: number | null): string {
  return value === null ? NOT_COMPUTABLE : signedAmountFormatter.format(value);
}

/** An index at heat map precision; `null` becomes the not-computable mark. */
export function formatHeatmapIndex(value: number | null): string {
  return value === null ? NOT_COMPUTABLE : formatNumber(value, HEATMAP_INDEX_DECIMALS);
}

/** Shortens a label where space is scarce; the full text stays available as text elsewhere. */
export function truncateName(name: string, maxChars: number): string {
  if (name.length <= maxChars) {
    return name;
  }
  return `${name.slice(0, maxChars - 1).trimEnd()}${ELLIPSIS}`;
}

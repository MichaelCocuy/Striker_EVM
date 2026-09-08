/**
 * Chart-only formatting. Money and index values keep coming from `lib/format.ts`; this file
 * adds the two things an axis needs and nothing else.
 */

/** Same locale as `lib/format.ts`, which does not export it. */
const CHART_LOCALE = 'es-CO';
const COMPACT_MAX_FRACTION_DIGITS = 1;
const ELLIPSIS = '…';

const compactMoneyFormatter = new Intl.NumberFormat(CHART_LOCALE, {
  notation: 'compact',
  /** Spanish words ("40 mil") read better on an axis than the abbreviations ("40 k"). */
  compactDisplay: 'long',
  maximumFractionDigits: COMPACT_MAX_FRACTION_DIGITS,
});

/** Axis ticks are compact ("40 mil") so the money scale fits a narrow column. */
export function formatCompactMoney(value: number): string {
  return compactMoneyFormatter.format(value);
}

/** Shortens a label for an axis tick; the full text stays available in the tooltip. */
export function truncateName(name: string, maxChars: number): string {
  if (name.length <= maxChars) {
    return name;
  }
  return `${name.slice(0, maxChars - 1).trimEnd()}${ELLIPSIS}`;
}

const LOCALE = 'es-CO';

/** Shown wherever an indicator is not computable (`null` in the API response). */
export const NOT_COMPUTABLE = '—';

/** Money is presented with two decimals and indices with four (EVM_GUIA.md §7). */
export const MONEY_DECIMALS = 2;
export const INDEX_DECIMALS = 4;

const PERCENT_DECIMALS = 0;
const PERCENT_SUFFIX = '%';

export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Money with two decimals; `null` becomes the not-computable mark. */
export function formatMoney(value: number | null): string {
  return value === null ? NOT_COMPUTABLE : formatNumber(value, MONEY_DECIMALS);
}

/** Performance index with four decimals; `null` becomes the not-computable mark. */
export function formatIndex(value: number | null): string {
  return value === null ? NOT_COMPUTABLE : formatNumber(value, INDEX_DECIMALS);
}

/** Progress percentage as stored by the API (0-100 scale). */
export function formatPercent(value: number): string {
  return `${formatNumber(value, PERCENT_DECIMALS)}${PERCENT_SUFFIX}`;
}

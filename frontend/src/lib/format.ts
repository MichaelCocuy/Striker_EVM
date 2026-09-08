const LOCALE = 'es-CO';

export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

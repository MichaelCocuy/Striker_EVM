import type { PortfolioEntry } from './usePortfolio';

/**
 * Position of a project inside the portfolio.
 *
 * The two-digit number is the key that ties a row of the dense list to its bubble in the
 * quadrant, so it is assigned once, from the order the API returned, and shared by both.
 */
export interface PortfolioItem {
  /** `01` … `08`, the label shown in the list and inside the bubble. */
  number: string;
  entry: PortfolioEntry;
}

const NUMBER_PAD = { LENGTH: 2, CHARACTER: '0' } as const;
const FIRST_POSITION = 1;

export function projectNumberLabel(index: number): string {
  return String(index + FIRST_POSITION).padStart(NUMBER_PAD.LENGTH, NUMBER_PAD.CHARACTER);
}

export function toPortfolioItems(entries: readonly PortfolioEntry[]): PortfolioItem[] {
  return entries.map((entry, index) => ({ number: projectNumberLabel(index), entry }));
}

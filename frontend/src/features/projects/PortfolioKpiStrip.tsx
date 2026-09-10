import { useRef } from 'react';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { budgetLegend, PORTFOLIO_COPY } from './portfolio-copy';
import { PORTFOLIO_LAYOUT } from './portfolio-layout';

import type { PortfolioFigures } from './portfolio-figures';

/**
 * Four consolidated figures of the portfolio: budget, earned value, projects in red and the
 * projected deviation. Every one of them is a sum or a count over the reports the backend
 * returned; a total with nothing to add stays `—`.
 */

const FIGURE_CLASSES = 'text-figure-lg';

/** The strip shows whole units: the cents of a portfolio-wide sum are noise at 28 px. */
const FIGURE_DECIMALS = 0;
const POSITIVE_SIGN = '+';

const FIGURE_TONE = {
  INK: 'text-ink',
  GOOD: 'text-evm-good',
  BAD: 'text-evm-bad',
} as const;

interface KpiTileProps {
  overline: string;
  value: number | null;
  legend: string;
  toneClass: string;
  /** Prefixes a positive total with `+`, so a favourable deviation reads as one. */
  showPositiveSign?: boolean;
}

function KpiTile({ overline, value, legend, toneClass, showPositiveSign = false }: KpiTileProps) {
  const prefix = showPositiveSign && value !== null && value > 0 ? POSITIVE_SIGN : '';

  return (
    <li {...{ [REVEAL_ATTRIBUTE]: true }} className={PORTFOLIO_LAYOUT.KPI_TILE}>
      <p className="eyebrow">{overline}</p>
      <AnimatedNumber
        value={value}
        decimals={FIGURE_DECIMALS}
        prefix={prefix}
        className={`${FIGURE_CLASSES} ${toneClass}`}
      />
      <p className="text-caption text-ink-subtle">{legend}</p>
    </li>
  );
}

function deviationTone(value: number | null): string {
  if (value === null) {
    return FIGURE_TONE.INK;
  }
  return value < 0 ? FIGURE_TONE.BAD : FIGURE_TONE.GOOD;
}

interface PortfolioKpiStripProps {
  figures: PortfolioFigures;
}

export function PortfolioKpiStrip({ figures }: PortfolioKpiStripProps) {
  const stripRef = useRef<HTMLUListElement>(null);
  useStaggerReveal(stripRef);

  return (
    <ul ref={stripRef} aria-label={PORTFOLIO_COPY.KPI.LABEL} className={PORTFOLIO_LAYOUT.KPI_STRIP}>
      <KpiTile
        overline={PORTFOLIO_COPY.KPI.BUDGET.OVERLINE}
        value={figures.totalBudget}
        legend={budgetLegend(figures.budgetedProjectCount)}
        toneClass={FIGURE_TONE.INK}
      />
      <KpiTile
        overline={PORTFOLIO_COPY.KPI.EARNED_VALUE.OVERLINE}
        value={figures.totalEarnedValue}
        legend={PORTFOLIO_COPY.KPI.EARNED_VALUE.LEGEND}
        toneClass={FIGURE_TONE.INK}
      />
      <KpiTile
        overline={PORTFOLIO_COPY.KPI.RED.OVERLINE}
        value={figures.redProjectCount}
        legend={PORTFOLIO_COPY.KPI.RED.LEGEND}
        toneClass={FIGURE_TONE.BAD}
      />
      <KpiTile
        overline={PORTFOLIO_COPY.KPI.DEVIATION.OVERLINE}
        value={figures.totalVarianceAtCompletion}
        legend={PORTFOLIO_COPY.KPI.DEVIATION.LEGEND}
        toneClass={deviationTone(figures.totalVarianceAtCompletion)}
        showPositiveSign
      />
    </ul>
  );
}

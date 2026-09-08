import { MONEY_DECIMALS } from '@/lib/format';

import { StatusFigure } from './StatusFigure';
import { SUMMARY_REVEAL_ATTRIBUTE } from './summary-motion';

import type { IndicatorMeta } from './summary-copy';
import type { FigureReading } from './summary-reading';

interface VarianceRowProps {
  meta: IndicatorMeta;
  /** Money as the report brings it; `null` when the report could not compute it. */
  value: number | null;
  reading: FigureReading;
}

/**
 * A variance in money with its sign already interpreted, so a negative number is read as
 * "desfavorable" instead of leaving the reader to work out what the minus means.
 */
export function VarianceRow({ meta, value, reading }: VarianceRowProps) {
  return (
    <div
      {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }}
      className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-line p-4"
    >
      <dt className="flex flex-col gap-0.5">
        <span className="eyebrow">{meta.acronym}</span>
        <span className="text-sm font-medium text-ink">{meta.name}</span>
        <span className="text-xs text-ink-subtle">{meta.help}</span>
      </dt>
      <dd>
        <StatusFigure
          value={value}
          decimals={MONEY_DECIMALS}
          tone={reading.tone}
          reading={reading.label}
        />
      </dd>
    </div>
  );
}

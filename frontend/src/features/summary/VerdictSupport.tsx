import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { MONEY_DECIMALS } from '@/lib/format';

import { FIGURE_SIZE, FIGURE_SIZE_CLASS } from './figure-size';
import { StatusFigure } from './StatusFigure';

import type { IndicatorMeta } from './summary-copy';
import type { FigureReading } from './summary-reading';

const LABEL_SEPARATOR = ' · ';
const PLAIN_FIGURE_CLASS = `${FIGURE_SIZE_CLASS[FIGURE_SIZE.SUPPORT]} text-ink`;

interface VerdictSupportProps {
  meta: IndicatorMeta;
  /** Money as the report brings it; `null` when the report could not compute it. */
  value: number | null;
  /**
   * How the sign of the figure reads. Omitted for a plain reference figure such as the
   * budget, which has no favourable or unfavourable direction of its own.
   */
  reading?: FigureReading;
}

/** The money that backs an answer: the acronym and name of the figure next to its value. */
export function VerdictSupport({ meta, value, reading }: VerdictSupportProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <span className="eyebrow">{`${meta.acronym}${LABEL_SEPARATOR}${meta.name}`}</span>
      {reading === undefined ? (
        <AnimatedNumber value={value} decimals={MONEY_DECIMALS} className={PLAIN_FIGURE_CLASS} />
      ) : (
        <StatusFigure
          value={value}
          decimals={MONEY_DECIMALS}
          tone={reading.tone}
          reading={reading.label}
          size={FIGURE_SIZE.SUPPORT}
        />
      )}
    </div>
  );
}

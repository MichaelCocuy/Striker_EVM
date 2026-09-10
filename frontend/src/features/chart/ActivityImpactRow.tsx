import { EVM_TONE_TOKENS } from '@/evm/tone';
import { formatIndex, formatMoney } from '@/lib/format';

import { HALF_TRACK_PERCENT, toPercentLength, toScaleFraction } from './bar-scale';
import { IMPACT_COPY } from './impact-rows';
import { useFractionSweep } from './useFractionSweep';

import type { ImpactRow } from './impact-rows';

const TRACK_CLASS = 'relative h-2.5 w-full rounded-pill bg-surface-sunken';
const AXIS_MARK_CLASS = 'absolute -top-0.5 -bottom-0.5 w-px -translate-x-1/2 bg-line-strong';
/** The bar is rounded on its outer end only, so its inner end reads as leaving the axis. */
const NEGATIVE_BAR_CLASS = 'absolute inset-y-0 rounded-l-pill';
const POSITIVE_BAR_CLASS = 'absolute inset-y-0 rounded-r-pill';
/** Fixed money column so the tracks of every row start at the same place. */
const MONEY_CLASS = 'numeric w-28 shrink-0 text-right text-sm font-semibold';
const SEPARATOR = ' · ';

interface ActivityImpactRowProps {
  row: ImpactRow;
  /** Largest absolute variance of the report; it is the 100 % of each side of the axis. */
  scale: number;
}

/**
 * One activity of the ranking: its name, its cost variance as a bar diverging from the zero
 * axis, and the CPI with the interpretation the report brings, all in the traffic light of
 * its cost status.
 *
 * The name is truncated by CSS and kept whole in the `title`, and every number is real text:
 * only the track is hidden from assistive technology.
 */
export function ActivityImpactRow({ row, scale }: ActivityImpactRowProps) {
  const fraction = useFractionSweep(toScaleFraction(Math.abs(row.costVariance), scale));
  const sidePercent = fraction * HALF_TRACK_PERCENT;
  const { colorToken } = EVM_TONE_TOKENS[row.tone];
  const toneColor = `var(${colorToken})`;

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm text-ink" title={row.name}>
          {row.name}
        </span>
        <span className={MONEY_CLASS} style={{ color: toneColor }}>
          {formatMoney(row.costVariance)}
        </span>
      </div>
      <div aria-hidden="true" className={TRACK_CLASS}>
        <span className={AXIS_MARK_CLASS} style={{ left: toPercentLength(HALF_TRACK_PERCENT) }} />
        <span
          className={row.isNegative ? NEGATIVE_BAR_CLASS : POSITIVE_BAR_CLASS}
          style={{
            left: toPercentLength(
              row.isNegative ? HALF_TRACK_PERCENT - sidePercent : HALF_TRACK_PERCENT,
            ),
            width: toPercentLength(sidePercent),
            backgroundColor: toneColor,
          }}
        />
      </div>
      <p className="text-xs text-ink-muted">
        {IMPACT_COPY.CPI} {formatIndex(row.costPerformanceIndex)}
        {SEPARATOR}
        <span className="font-semibold" style={{ color: toneColor }}>
          {row.statusLabel}
        </span>
      </p>
    </li>
  );
}

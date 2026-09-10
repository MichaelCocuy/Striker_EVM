import { EVM_TONE_TOKENS } from '@/evm/tone';
import { formatMoney } from '@/lib/format';
import { useFractionSweep } from '@/motion/useFractionSweep';

import { FULL_TRACK_PERCENT, toPercentLength, toScaleFraction } from './bar-scale';

import type { ComparisonRow } from './comparison-rows';

/** The track does not clip, so a reference sitting at the 100 % of the scale stays visible. */
const TRACK_CLASS = 'relative h-4 min-w-0 flex-1 rounded-pill bg-surface-sunken';
const FILL_CLASS = 'absolute inset-y-0 left-0 rounded-pill';
const GAP_BAND_CLASS = 'absolute inset-y-0 rounded-pill';
/** The mark overshoots the track above and below so it reads as a scale tick. */
const REFERENCE_MARK_CLASS = 'absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-pill';
/** Fixed money column so the three tracks start and end at the same place. */
const MONEY_CLASS = 'numeric w-28 shrink-0 text-right text-sm font-semibold text-ink';

interface ComparisonBarProps {
  row: ComparisonRow;
  /** Largest of the three values; it is the 100 % of the shared money scale. */
  scale: number;
}

/**
 * One row of the comparison: the value as a bar, the value as text, and — when the row is
 * read against another one — the distance to that reference as a toned band, a tick on the
 * track and the variance in words.
 *
 * The band is what turns "EV is shorter than PV" into a measurable gap: it spans exactly the
 * money between the bar and its reference, so the schedule and cost deviations are seen
 * instead of inferred.
 */
export function ComparisonBar({ row, scale }: ComparisonBarProps) {
  const { gap } = row;
  const valueFraction = useFractionSweep(toScaleFraction(row.value, scale));
  const referenceFraction = useFractionSweep(
    toScaleFraction(gap === undefined ? row.value : gap.referenceValue, scale),
  );
  const gapStart = Math.min(valueFraction, referenceFraction);
  const gapWidth = Math.abs(valueFraction - referenceFraction);
  /** Bundled so the row is rendered on a single presence check of the gap. */
  const gapView = gap === undefined ? undefined : { ...gap, colors: EVM_TONE_TOKENS[gap.tone] };

  return (
    <div className="flex flex-col gap-1.5">
      <dt className="flex items-baseline gap-2">
        <span className="text-sm text-ink-muted">{row.label}</span>
        <span className="eyebrow">{row.acronym}</span>
      </dt>
      <dd className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className={TRACK_CLASS}>
            <span
              className={FILL_CLASS}
              style={{
                width: toPercentLength(valueFraction * FULL_TRACK_PERCENT),
                backgroundColor: `var(${row.colorToken})`,
              }}
            />
            {gapView && (
              <>
                <span
                  className={GAP_BAND_CLASS}
                  style={{
                    left: toPercentLength(gapStart * FULL_TRACK_PERCENT),
                    width: toPercentLength(gapWidth * FULL_TRACK_PERCENT),
                    backgroundColor: `var(${gapView.colors.softColorToken})`,
                  }}
                />
                <span
                  className={REFERENCE_MARK_CLASS}
                  style={{
                    left: toPercentLength(referenceFraction * FULL_TRACK_PERCENT),
                    backgroundColor: `var(${gapView.colors.colorToken})`,
                  }}
                />
              </>
            )}
          </div>
          <span className={MONEY_CLASS}>{formatMoney(row.value)}</span>
        </div>
        {gapView && (
          <p
            className="text-xs font-semibold"
            style={{ color: `var(${gapView.colors.colorToken})` }}
          >
            {gapView.reading}
          </p>
        )}
      </dd>
    </div>
  );
}

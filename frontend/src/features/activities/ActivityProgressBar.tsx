import { formatPercent } from '@/lib/format';

import { progressReading } from './activity-progress';
import { ActivityProgressTrack } from './ActivityProgressTrack';

import type { ActivityMeasures, EvmIndicators } from '@/api/types';

interface ActivityProgressBarProps {
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

/**
 * Progress cell of the activities table: the stacked bar and the real percentage next to it.
 *
 * Both percentages come from the report; the bar only paints them. The whole reading, BAC and
 * PV included, is exposed as text for screen readers and as the bar's tooltip for everyone
 * else, because those two figures no longer have a column of their own.
 */
export function ActivityProgressBar({ input, indicators }: ActivityProgressBarProps) {
  const reading = progressReading({ input, indicators });

  return (
    <span className="flex flex-1 items-center gap-2">
      <span className="sr-only">{reading}</span>
      <span title={reading} className="flex min-w-16 flex-1 items-center">
        <ActivityProgressTrack
          plannedPercent={input.plannedProgressPercent}
          actualPercent={input.actualProgressPercent}
        />
      </span>
      <span
        aria-hidden="true"
        className="w-11 shrink-0 text-right text-caption tabular-nums text-ink-muted"
      >
        {formatPercent(input.actualProgressPercent)}
      </span>
    </span>
  );
}

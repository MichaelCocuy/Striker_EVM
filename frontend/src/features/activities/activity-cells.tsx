import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';

import { ACTIVITY_INDICATOR_COLUMNS, TABLE_CLASS } from './activity-table';

import type { EvmIndicators } from '@/api/types';

interface ActivityIndicatorCellsProps {
  indicators: EvmIndicators;
}

/**
 * One cell per indicator, exactly as the report brings it, in the order of
 * `ACTIVITY_INDICATOR_COLUMNS`: values count up towards the new number when the report is
 * refetched and a `null` renders as an em dash.
 */
export function ActivityIndicatorCells({ indicators }: ActivityIndicatorCellsProps) {
  return (
    <>
      {ACTIVITY_INDICATOR_COLUMNS.map((column) => (
        <td key={column.key} className={TABLE_CLASS.NUMERIC_CELL}>
          <AnimatedNumber value={indicators[column.key]} decimals={column.decimals} />
        </td>
      ))}
    </>
  );
}

interface ActivityStatusCellProps {
  indicators: EvmIndicators;
}

/** Both traffic lights of the activity, with the same tones used across the dashboard. */
export function ActivityStatusCell({ indicators }: ActivityStatusCellProps) {
  return (
    <td className={TABLE_CLASS.CELL}>
      <div className="flex flex-wrap gap-2">
        <StatusPill
          tone={costStatusTone(indicators.costStatus)}
          label={COST_STATUS_LABEL[indicators.costStatus]}
        />
        <StatusPill
          tone={scheduleStatusTone(indicators.scheduleStatus)}
          label={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
        />
      </div>
    </td>
  );
}

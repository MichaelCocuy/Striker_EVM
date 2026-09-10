import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { formatIndex } from '@/lib/format';

import { ACTIVITY_INDEX_STATUS } from './activity-table';

import type { ActivityIndexColumn, ActivityIndexStatus } from './activity-table';
import type { EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

interface IndexStatusReading {
  tone: EvmTone;
  /** The interpretation the report sent for that traffic light. */
  label: string;
}

/** Each index wears the tone of the status the report brings for it, never a computed one. */
const INDEX_STATUS_READING: Record<
  ActivityIndexStatus,
  (indicators: EvmIndicators) => IndexStatusReading
> = {
  [ACTIVITY_INDEX_STATUS.COST]: ({ costStatus }) => ({
    tone: costStatusTone(costStatus),
    label: COST_STATUS_LABEL[costStatus],
  }),
  [ACTIVITY_INDEX_STATUS.SCHEDULE]: ({ scheduleStatus }) => ({
    tone: scheduleStatusTone(scheduleStatus),
    label: SCHEDULE_STATUS_LABEL[scheduleStatus],
  }),
};

interface ActivityIndexPillProps {
  column: ActivityIndexColumn;
  indicators: EvmIndicators;
}

/**
 * An index inside its traffic-light pill: the four decimals of EVM_GUIA §7 when it is
 * computable, the em dash and the "no aplica" tone when it is not. The interpretation stays
 * readable as text next to the number, which on its own only says "0,8000".
 */
export function ActivityIndexPill({ column, indicators }: ActivityIndexPillProps) {
  const { tone, label } = INDEX_STATUS_READING[column.statusKey](indicators);

  return (
    <span className="inline-flex items-center">
      <StatusPill tone={tone} label={formatIndex(indicators[column.key])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

import { STATUS_PILL_SIZE } from '@/components/ui/status-pill-sizes';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  EVM_TONE,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';

import { PORTFOLIO_COPY } from './portfolio-copy';

import type { EvmIndicators } from '@/api/types';

interface ProjectStatusPillsProps {
  /** Consolidated indicators as the report returned them; `null` when it could not be read. */
  indicators: EvmIndicators | null;
}

/**
 * Cost and schedule traffic lights of one project, always with their label in text: the
 * semaphore never communicates by colour alone. Nothing is computed here.
 */
export function ProjectStatusPills({ indicators }: ProjectStatusPillsProps) {
  if (indicators === null) {
    return (
      <ul className="flex flex-wrap gap-1.5" aria-label={PORTFOLIO_COPY.LIST.STATUS_LABEL}>
        <li>
          <StatusPill
            tone={EVM_TONE.NA}
            label={PORTFOLIO_COPY.LIST.STATUS_UNAVAILABLE}
            size={STATUS_PILL_SIZE.SM}
          />
        </li>
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={PORTFOLIO_COPY.LIST.STATUS_LABEL}>
      <li>
        <StatusPill
          tone={costStatusTone(indicators.costStatus)}
          label={COST_STATUS_LABEL[indicators.costStatus]}
          size={STATUS_PILL_SIZE.SM}
        />
      </li>
      <li>
        <StatusPill
          tone={scheduleStatusTone(indicators.scheduleStatus)}
          label={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
          size={STATUS_PILL_SIZE.SM}
        />
      </li>
    </ul>
  );
}

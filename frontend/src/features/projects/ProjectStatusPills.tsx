import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  EVM_TONE,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';

import type { EvmIndicators } from '@/api/types';

const COPY = {
  LABEL: 'Estado consolidado',
  UNAVAILABLE: 'Estado no disponible',
} as const;

interface ProjectStatusPillsProps {
  /** Consolidated indicators as the report returned them; `null` when it could not be read. */
  indicators: EvmIndicators | null;
}

/** Cost and schedule traffic lights of one project. Nothing is computed here. */
export function ProjectStatusPills({ indicators }: ProjectStatusPillsProps) {
  if (indicators === null) {
    return (
      <ul className="flex flex-wrap gap-2" aria-label={COPY.LABEL}>
        <li>
          <StatusPill tone={EVM_TONE.NA} label={COPY.UNAVAILABLE} />
        </li>
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label={COPY.LABEL}>
      <li>
        <StatusPill
          tone={costStatusTone(indicators.costStatus)}
          label={COST_STATUS_LABEL[indicators.costStatus]}
        />
      </li>
      <li>
        <StatusPill
          tone={scheduleStatusTone(indicators.scheduleStatus)}
          label={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
        />
      </li>
    </ul>
  );
}

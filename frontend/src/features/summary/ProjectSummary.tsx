import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { formatIndex, formatMoney } from '@/lib/format';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ProjectSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  className?: string;
}

const COPY = {
  EYEBROW: 'Consolidado',
  TITLE: 'Estado del proyecto',
  DESCRIPTION: 'Indicadores del proyecto completo, calculados sumando dinero.',
  BUDGET: 'Presupuesto (BAC)',
  EARNED: 'Valor ganado (EV)',
  ACTUAL: 'Costo real (AC)',
  CPI: 'CPI',
  SPI: 'SPI',
} as const;

const SKELETON_LINES = 5;

/**
 * Consolidated indicator panel of the dashboard (module M9).
 *
 * Contract: it only renders what the report brings; it never derives an indicator.
 */
export function ProjectSummary({ indicators, className = '', ...rest }: ProjectSummaryProps) {
  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {indicators === null ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <SummaryFigure label={COPY.BUDGET} value={formatMoney(indicators.budgetAtCompletion)} />
            <SummaryFigure label={COPY.EARNED} value={formatMoney(indicators.earnedValue)} />
            <SummaryFigure label={COPY.ACTUAL} value={formatMoney(indicators.actualCost)} />
            <SummaryFigure label={COPY.CPI} value={formatIndex(indicators.costPerformanceIndex)} />
            <SummaryFigure
              label={COPY.SPI}
              value={formatIndex(indicators.schedulePerformanceIndex)}
            />
          </dl>
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
          {indicators.notes.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-ink-muted">
              {indicators.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

interface SummaryFigureProps {
  label: string;
  value: string;
}

function SummaryFigure({ label, value }: SummaryFigureProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="numeric text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

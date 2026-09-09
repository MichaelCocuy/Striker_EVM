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
export interface ProjectVerdictProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  className?: string;
}

const COPY = {
  EYEBROW: 'Veredicto',
  TITLE: '¿Cómo va el proyecto?',
  DESCRIPTION: 'La respuesta en una línea, antes de cualquier número.',
  COST_QUESTION: '¿Cómo vamos en costo?',
  SCHEDULE_QUESTION: '¿Cómo vamos en cronograma?',
  FORECAST_QUESTION: '¿En cuánto va a terminar?',
} as const;

const SKELETON_LINES = 4;

/**
 * Headline band of the reviewer's dashboard: the verdict in plain Spanish plus the three
 * questions a project lead actually asks (cost, schedule, forecast).
 *
 * Contract: it only reads and interprets what the report brings; it never derives an indicator.
 */
export function ProjectVerdict({ indicators, className = '', ...rest }: ProjectVerdictProps) {
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
        <div className="grid gap-4 lg:grid-cols-3">
          <VerdictAnswer
            question={COPY.COST_QUESTION}
            figure={formatIndex(indicators.costPerformanceIndex)}
            detail={formatMoney(indicators.costVariance)}
          >
            <StatusPill
              tone={costStatusTone(indicators.costStatus)}
              label={COST_STATUS_LABEL[indicators.costStatus]}
            />
          </VerdictAnswer>
          <VerdictAnswer
            question={COPY.SCHEDULE_QUESTION}
            figure={formatIndex(indicators.schedulePerformanceIndex)}
            detail={formatMoney(indicators.scheduleVariance)}
          >
            <StatusPill
              tone={scheduleStatusTone(indicators.scheduleStatus)}
              label={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
            />
          </VerdictAnswer>
          <VerdictAnswer
            question={COPY.FORECAST_QUESTION}
            figure={formatMoney(indicators.estimateAtCompletion)}
            detail={formatMoney(indicators.varianceAtCompletion)}
          />
        </div>
      )}
    </Card>
  );
}

interface VerdictAnswerProps {
  question: string;
  figure: string;
  detail: string;
  children?: React.ReactNode;
}

function VerdictAnswer({ question, figure, detail, children }: VerdictAnswerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-sunken p-4">
      <p className="text-sm text-ink-muted">{question}</p>
      <p className="numeric text-3xl font-semibold text-ink">{figure}</p>
      {children}
      <p className="numeric text-sm text-ink-subtle">{detail}</p>
    </div>
  );
}

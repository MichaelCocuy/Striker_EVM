import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface EvmChartProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** One entry per activity, in the order the report returns them. */
  activities: readonly EvmActivityReport[];
  /** Consolidated indicators, for the CPI and SPI gauges. */
  indicators: EvmIndicators | null;
  isLoading: boolean;
  className?: string;
}

const COPY = {
  EYEBROW: 'Comparación',
  TITLE: 'PV, EV y AC por actividad',
  DESCRIPTION: 'Lo planificado, lo ganado y lo gastado, en la misma escala de dinero.',
  EMPTY: 'Agrega una actividad para ver la comparación.',
  PLANNED: 'PV',
  EARNED: 'EV',
  ACTUAL: 'AC',
} as const;

const SKELETON_LINES = 6;

/**
 * PV / EV / AC comparison and the CPI-SPI gauges (module M10).
 *
 * Contract: reads the report as given; the table below is the accessible fallback that the
 * chart must keep in sync.
 */
export function EvmChart({
  activities,
  indicators,
  isLoading,
  className = '',
  ...rest
}: EvmChartProps) {
  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : activities.length === 0 ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {activities.map((activity) => (
            <li key={activity.id} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ink">{activity.name}</span>
              <span className="numeric text-sm text-ink-muted">
                {COPY.PLANNED} {formatMoney(activity.indicators.plannedValue)} · {COPY.EARNED}{' '}
                {formatMoney(activity.indicators.earnedValue)} · {COPY.ACTUAL}{' '}
                {formatMoney(activity.indicators.actualCost)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {indicators !== null && activities.length > 0 && (
        <p className="numeric text-sm text-ink-muted">
          {COPY.PLANNED} {formatMoney(indicators.plannedValue)} · {COPY.EARNED}{' '}
          {formatMoney(indicators.earnedValue)} · {COPY.ACTUAL} {formatMoney(indicators.actualCost)}
        </p>
      )}
    </Card>
  );
}

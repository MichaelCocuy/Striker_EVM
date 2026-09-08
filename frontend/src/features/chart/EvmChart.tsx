import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  COST_STATUS_LABEL,
  costStatusTone,
  SCHEDULE_STATUS_LABEL,
  scheduleStatusTone,
} from '@/evm/tone';

import { ActivityComparisonChart } from './ActivityComparisonChart';
import { toChartRows } from './chart-rows';
import { GAUGE_REFERENCE_LABEL } from './gauge-geometry';
import { IndexGauge } from './IndexGauge';

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
  CPI: {
    NAME: 'CPI',
    DESCRIPTION: `Trabajo ganado por cada peso gastado. Referencia ${GAUGE_REFERENCE_LABEL}.`,
  },
  SPI: {
    NAME: 'SPI',
    DESCRIPTION: `Avance logrado frente al planificado. Referencia ${GAUGE_REFERENCE_LABEL}.`,
  },
} as const;

/**
 * PV / EV / AC comparison and the CPI-SPI gauges (module M10).
 *
 * Contract: reads the report as given and never derives an EVM value. The plot is a picture,
 * so `ActivityComparisonChart` also ships a hidden table with the same numbers.
 */
export function EvmChart({
  activities,
  indicators,
  isLoading,
  className = '',
  ...rest
}: EvmChartProps) {
  /** Memoized so a re-render with the same report does not restart the bar animation. */
  const rows = useMemo(() => toChartRows(activities), [activities]);

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
          ) : (
            <ActivityComparisonChart rows={rows} />
          )}
          {indicators !== null && (
            <div className="grid gap-3 sm:grid-cols-2">
              <IndexGauge
                name={COPY.CPI.NAME}
                description={COPY.CPI.DESCRIPTION}
                value={indicators.costPerformanceIndex}
                tone={costStatusTone(indicators.costStatus)}
                statusLabel={COST_STATUS_LABEL[indicators.costStatus]}
              />
              <IndexGauge
                name={COPY.SPI.NAME}
                description={COPY.SPI.DESCRIPTION}
                value={indicators.schedulePerformanceIndex}
                tone={scheduleStatusTone(indicators.scheduleStatus)}
                statusLabel={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** Placeholder with the shape of the loaded card: legend line, plot area and two gauges. */
function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-60 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}

import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

import { toActivityBarRows } from './activity-bars';
import { ActivityBarsChart } from './ActivityBarsChart';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface EvmChartProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** One entry per activity, in the order the report returns them. */
  activities: readonly EvmActivityReport[];
  isLoading: boolean;
  className?: string;
}

/**
 * The dashboard gives this card one grid cell whose height is set by its taller neighbour,
 * so the card sizes itself to its content instead of stretching into an empty box.
 */
const DEFAULT_CLASS_NAME = 'self-start';

const COPY = {
  EYEBROW: 'Comparación',
  TITLE: 'PV, EV y AC por actividad',
  DESCRIPTION:
    'Barras a la misma escala de dinero. La marca vertical señala el presupuesto total de cada actividad.',
  EMPTY: 'Agrega una actividad para ver la comparación.',
} as const;

const SKELETON = { LEGEND_CLASS: 'h-3 w-2/3', PLOT_CLASS: 'h-60 w-full' } as const;

/**
 * Per-activity PV / EV / AC comparison (handoff §3.4, redesign of the existing chart).
 *
 * Contract: it reads the report as given and never derives an EVM value. The plot is a
 * picture, so `ActivityBarsChart` also ships a hidden table with the same numbers.
 */
export function EvmChart({
  activities,
  isLoading,
  className = DEFAULT_CLASS_NAME,
  ...rest
}: EvmChartProps) {
  /** Memoized so a re-render with the same report does not restart the bar sweep. */
  const rows = useMemo(() => toActivityBarRows(activities), [activities]);

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
      ) : rows.length === 0 ? (
        <p className="text-small text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <ActivityBarsChart rows={rows} />
      )}
    </Card>
  );
}

/** Placeholder with the shape of the loaded card, so the layout does not jump. */
function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className={SKELETON.PLOT_CLASS} />
      <Skeleton className={SKELETON.LEGEND_CLASS} />
    </div>
  );
}

import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';

import { ActivityImpactRow } from './ActivityImpactRow';
import { impactScale, toImpactConclusion, toImpactRows } from './impact-rows';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ActivityImpactRankingProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Activities as the report returns them; the ranking is derived from their variances. */
  activities: readonly EvmActivityReport[];
  isLoading: boolean;
  className?: string;
}

const COPY = {
  EYEBROW: 'Foco',
  TITLE: '¿Dónde está el problema?',
  DESCRIPTION:
    'Cuánto aporta cada actividad a la desviación de costo del proyecto, de la que más resta a la que más aporta.',
  AXIS_NEGATIVE: 'Sobrecosto',
  AXIS_POSITIVE: 'Ahorro',
  LIST_LABEL: 'Actividades ordenadas por su desviación de costo',
  EMPTY: 'Sin actividades no hay nada que ordenar.',
} as const;

/** One placeholder line per activity of the demo projects plus its reading. */
const SKELETON_LINES = 6;

/**
 * Activities ranked by their contribution to the project's cost variance, so the reviewer
 * sees which one drags the project instead of having to read the whole table. The bars
 * diverge from a zero axis — money lost to the left, money saved to the right — and one line
 * of conclusion names the activity that concentrates the deviation.
 *
 * Contract: it orders and plots the variances the report brings; it computes no indicator.
 */
export function ActivityImpactRanking({
  activities,
  isLoading,
  className = '',
  ...rest
}: ActivityImpactRankingProps) {
  /** Memoized so a re-render with the same report does not restart the bar sweep. */
  const rows = useMemo(() => toImpactRows(activities), [activities]);
  const scale = impactScale(rows);
  const conclusion = toImpactConclusion(rows);

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
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-md bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink">
            {conclusion}
          </p>
          <p aria-hidden="true" className="flex justify-between text-xs text-ink-subtle">
            <span>{COPY.AXIS_NEGATIVE}</span>
            <span>{COPY.AXIS_POSITIVE}</span>
          </p>
          <ul aria-label={COPY.LIST_LABEL} className="flex flex-col gap-3">
            {rows.map((row) => (
              <ActivityImpactRow key={row.id} row={row} scale={scale} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

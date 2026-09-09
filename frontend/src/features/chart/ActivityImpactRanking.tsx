import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format';

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
  EMPTY: 'Sin actividades no hay nada que ordenar.',
} as const;

const SKELETON_LINES = 4;

/**
 * Activities ranked by their contribution to the project's cost variance, so the reviewer
 * sees which one drags the project instead of having to read the whole table.
 *
 * Contract: it orders and plots the variances the report brings; it computes no indicator.
 */
export function ActivityImpactRanking({
  activities,
  isLoading,
  className = '',
  ...rest
}: ActivityImpactRankingProps) {
  const ranked = [...activities].sort(
    (left, right) => left.indicators.costVariance - right.indicators.costVariance,
  );

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
      ) : ranked.length === 0 ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ranked.map((activity) => (
            <li key={activity.id} className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-ink">{activity.name}</span>
              <span className="numeric text-sm font-semibold text-ink">
                {formatMoney(activity.indicators.costVariance)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

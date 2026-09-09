import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface EvmComparisonBarsProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  isLoading: boolean;
  className?: string;
}

const COPY = {
  EYEBROW: 'La foto',
  TITLE: 'Debía llevar, llevo, pagué',
  DESCRIPTION:
    'Los tres valores del proyecto en la misma escala de dinero. Es la comparación de la que sale todo lo demás.',
  PLANNED: 'Debía llevar hecho',
  EARNED: 'Llevo hecho',
  ACTUAL: 'He pagado',
  EMPTY: 'Agrega una actividad para ver la comparación.',
} as const;

const SKELETON_LINES = 3;

/**
 * Project-level PV / EV / AC comparison as three horizontal bars on one money scale
 * (docs/EVM_GUIA.md §2): EV below PV reads as late, AC above EV reads as expensive.
 *
 * Contract: it plots what the report brings and never derives an EVM value.
 */
export function EvmComparisonBars({
  indicators,
  isLoading,
  className = '',
  ...rest
}: EvmComparisonBarsProps) {
  const scale = indicators === null ? 0 : maxOf(indicators);

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading || indicators === null ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : scale === 0 ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <dl className="flex flex-col gap-4">
          <ComparisonBar label={COPY.PLANNED} value={indicators.plannedValue} scale={scale} />
          <ComparisonBar label={COPY.EARNED} value={indicators.earnedValue} scale={scale} />
          <ComparisonBar label={COPY.ACTUAL} value={indicators.actualCost} scale={scale} />
        </dl>
      )}
    </Card>
  );
}

function maxOf(indicators: EvmIndicators): number {
  return Math.max(indicators.plannedValue, indicators.earnedValue, indicators.actualCost);
}

const FULL_WIDTH_PERCENT = 100;

interface ComparisonBarProps {
  label: string;
  value: number;
  scale: number;
}

function ComparisonBar({ label, value, scale }: ComparisonBarProps) {
  const width = (value / scale) * FULL_WIDTH_PERCENT;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-ink-muted">{label}</dt>
        <dd className="numeric text-sm font-semibold text-ink">{formatMoney(value)}</dd>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-pill bg-surface-sunken">
        <div className="h-full rounded-pill bg-accent" style={{ width: `${String(width)}%` }} />
      </div>
    </div>
  );
}

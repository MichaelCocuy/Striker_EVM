import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';

import { comparisonScale, toComparisonRows } from './comparison-rows';
import { ComparisonBar } from './ComparisonBar';

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
  LIST_LABEL: 'Comparación de PV, EV y AC del proyecto',
  EMPTY: 'Agrega una actividad para ver los tres valores.',
} as const;

/** One placeholder line per bar plus one for its reading. */
const SKELETON_LINES = 6;

/** A project without activities reports the three values as zero, so the scale is zero too. */
const EMPTY_SCALE = 0;

/**
 * Project-level PV / EV / AC comparison as three horizontal bars on one money scale
 * (docs/EVM_GUIA.md §2): EV below PV reads as late, AC above EV reads as expensive. Each of
 * those two comparisons is drawn as a toned band between the bar and its reference, so the
 * deviation is a visible distance and not something the reviewer has to work out.
 *
 * It is a description list of real text, so a screen reader gets the same three numbers and
 * the same two readings; only the tracks are hidden from assistive technology.
 *
 * Contract: it renders what the report brings and never derives an EVM value.
 */
export function EvmComparisonBars({
  indicators,
  isLoading,
  className = '',
  ...rest
}: EvmComparisonBarsProps) {
  /** Memoized so a re-render with the same report does not restart the bar sweep. */
  const rows = useMemo(
    () => (indicators === null ? [] : toComparisonRows(indicators)),
    [indicators],
  );
  const scale = rows.length === 0 ? EMPTY_SCALE : comparisonScale(rows);

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
      ) : scale === EMPTY_SCALE ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <dl aria-label={COPY.LIST_LABEL} className="flex flex-col gap-4">
          {rows.map((row) => (
            <ComparisonBar key={row.key} row={row} scale={scale} />
          ))}
        </dl>
      )}
    </Card>
  );
}

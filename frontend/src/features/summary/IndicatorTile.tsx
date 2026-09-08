import { SUMMARY_REVEAL_ATTRIBUTE } from './summary-motion';

import type { IndicatorMeta } from './summary-copy';
import type { ReactNode } from 'react';

interface IndicatorTileProps {
  meta: IndicatorMeta;
  /** The figure of the indicator: an animated number, on its own or with its status pill. */
  children: ReactNode;
  className?: string;
}

/**
 * One indicator inside a definition list: acronym, Spanish name, figure and the question
 * the indicator answers, so the number is never shown without its meaning.
 */
export function IndicatorTile({ meta, children, className = '' }: IndicatorTileProps) {
  return (
    <div
      {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }}
      className={`flex flex-col gap-3 rounded-md bg-surface-sunken p-4 ${className}`}
    >
      <dt className="flex flex-col gap-0.5">
        <span className="eyebrow">{meta.acronym}</span>
        <span className="text-sm font-medium text-ink">{meta.name}</span>
      </dt>
      <dd className="flex flex-col gap-2">
        {children}
        <p className="text-xs text-ink-subtle">{meta.help}</p>
      </dd>
    </div>
  );
}

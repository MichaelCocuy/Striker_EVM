import { useRef } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { SUMMARY_REVEAL_KEY, SUMMARY_REVEAL_SELECTOR } from './summary-motion';
import { VERDICT_COPY, VERDICT_LEVEL_LABEL } from './verdict-copy';
import { readVerdict } from './verdict-reading';
import { VerdictBanner } from './VerdictBanner';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ProjectVerdictProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  className?: string;
}

const SKELETON = {
  ANSWER_TILES: 3,
  HEADLINE_CLASS: 'h-10 w-4/5',
  DETAIL_CLASS: 'h-4 w-3/5',
  BADGE_CLASS: 'h-7 w-28',
  TILE_CLASS: 'h-48 w-full',
} as const;

const GRID = {
  SKELETON: 'grid gap-3 md:grid-cols-2 xl:grid-cols-3',
} as const;

/**
 * Headline band of the reviewer's dashboard: the verdict in plain Spanish and what it costs
 * at the closing, so the state of the project lands before any number is read.
 *
 * Contract: it only reads and interprets what the report brings; it never derives an
 * indicator. The verdict is looked up by the pair of statuses the report already decided.
 */
export function ProjectVerdict({ indicators, className = '', ...rest }: ProjectVerdictProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(contentRef, {
    selector: SUMMARY_REVEAL_SELECTOR,
    revealKey: indicators === null ? SUMMARY_REVEAL_KEY.LOADING : SUMMARY_REVEAL_KEY.READING,
  });

  return (
    <Card
      eyebrow={VERDICT_COPY.EYEBROW}
      title={VERDICT_COPY.TITLE}
      description={VERDICT_COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      <div ref={contentRef} className="flex flex-col gap-6">
        {indicators === null ? <LoadingBand /> : <VerdictBand indicators={indicators} />}
      </div>
    </Card>
  );
}

function LoadingBand() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-line p-5">
        <Skeleton className={SKELETON.BADGE_CLASS} />
        <Skeleton className={SKELETON.HEADLINE_CLASS} />
        <Skeleton className={SKELETON.DETAIL_CLASS} />
      </div>
      <div className={GRID.SKELETON}>
        {Array.from({ length: SKELETON.ANSWER_TILES }, (_unused, index) => (
          <Skeleton key={index} className={SKELETON.TILE_CLASS} />
        ))}
      </div>
      <p className="text-sm text-ink-muted">{VERDICT_COPY.LOADING_LABEL}</p>
    </div>
  );
}

interface BandProps {
  indicators: EvmIndicators;
}

function VerdictBand({ indicators }: BandProps) {
  const verdict = readVerdict(indicators);

  return (
    <VerdictBanner
      tone={verdict.tone}
      badge={VERDICT_LEVEL_LABEL[verdict.level]}
      headline={verdict.headline}
      detail={verdict.detail}
    />
  );
}

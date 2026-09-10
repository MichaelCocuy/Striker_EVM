import { useRef } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { INDEX_DECIMALS, MONEY_DECIMALS } from '@/lib/format';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { FIGURE_SIZE } from './figure-size';
import { StatusFigure } from './StatusFigure';
import { INDICATORS } from './summary-copy';
import { SUMMARY_REVEAL_KEY, SUMMARY_REVEAL_SELECTOR } from './summary-motion';
import { readSign } from './summary-reading';
import { SummarySection } from './SummarySection';
import {
  COMPLETION_VARIANCE_SHORT_READING,
  COST_VARIANCE_SHORT_READING,
  SCHEDULE_VARIANCE_SHORT_READING,
  VERDICT_COPY,
  VERDICT_LEVEL_LABEL,
} from './verdict-copy';
import { readVerdict } from './verdict-reading';
import { VerdictAnswerTile } from './VerdictAnswerTile';
import { VerdictBanner } from './VerdictBanner';
import { VerdictSupport } from './VerdictSupport';

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
  ANSWERS: 'md:grid-cols-2 xl:grid-cols-3',
  SKELETON: 'grid gap-3 md:grid-cols-2 xl:grid-cols-3',
} as const;

/**
 * Headline band of the reviewer's dashboard: the verdict in plain Spanish, what it costs at
 * the closing, and the three questions a project lead actually asks (cost, schedule,
 * forecast) each answered by the indicator that answers it.
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
    <>
      <VerdictBanner
        tone={verdict.tone}
        badge={VERDICT_LEVEL_LABEL[verdict.level]}
        headline={verdict.headline}
        detail={verdict.detail}
      />
      {verdict.hasAnswers && (
        <SummarySection
          heading={VERDICT_COPY.ANSWERS_HEADING}
          hint={VERDICT_COPY.ANSWERS_HINT}
          listClassName={GRID.ANSWERS}
        >
          <CostAnswer indicators={indicators} />
          <ScheduleAnswer indicators={indicators} />
          <ForecastAnswer indicators={indicators} />
        </SummarySection>
      )}
    </>
  );
}

function CostAnswer({ indicators }: BandProps) {
  const tone = costStatusTone(indicators.costStatus);

  return (
    <VerdictAnswerTile
      question={VERDICT_COPY.COST_QUESTION}
      meta={INDICATORS.COST_PERFORMANCE_INDEX}
      tone={tone}
    >
      <StatusFigure
        value={indicators.costPerformanceIndex}
        decimals={INDEX_DECIMALS}
        tone={tone}
        reading={COST_STATUS_LABEL[indicators.costStatus]}
        size={FIGURE_SIZE.COMPACT}
      />
      <VerdictSupport
        meta={INDICATORS.COST_VARIANCE}
        value={indicators.costVariance}
        reading={readSign(indicators.costVariance, COST_VARIANCE_SHORT_READING)}
      />
    </VerdictAnswerTile>
  );
}

function ScheduleAnswer({ indicators }: BandProps) {
  const tone = scheduleStatusTone(indicators.scheduleStatus);

  return (
    <VerdictAnswerTile
      question={VERDICT_COPY.SCHEDULE_QUESTION}
      meta={INDICATORS.SCHEDULE_PERFORMANCE_INDEX}
      tone={tone}
    >
      <StatusFigure
        value={indicators.schedulePerformanceIndex}
        decimals={INDEX_DECIMALS}
        tone={tone}
        reading={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
        size={FIGURE_SIZE.COMPACT}
      />
      <VerdictSupport
        meta={INDICATORS.SCHEDULE_VARIANCE}
        value={indicators.scheduleVariance}
        reading={readSign(indicators.scheduleVariance, SCHEDULE_VARIANCE_SHORT_READING)}
      />
    </VerdictAnswerTile>
  );
}

function ForecastAnswer({ indicators }: BandProps) {
  const forecast = readSign(indicators.varianceAtCompletion, COMPLETION_VARIANCE_SHORT_READING);

  return (
    <VerdictAnswerTile
      question={VERDICT_COPY.FORECAST_QUESTION}
      meta={INDICATORS.ESTIMATE_AT_COMPLETION}
      tone={forecast.tone}
    >
      <StatusFigure
        value={indicators.estimateAtCompletion}
        decimals={MONEY_DECIMALS}
        tone={forecast.tone}
        reading={forecast.label}
        size={FIGURE_SIZE.COMPACT}
      />
      <VerdictSupport
        meta={INDICATORS.BUDGET_AT_COMPLETION}
        value={indicators.budgetAtCompletion}
      />
      <VerdictSupport
        meta={INDICATORS.VARIANCE_AT_COMPLETION}
        value={indicators.varianceAtCompletion}
        reading={forecast}
      />
    </VerdictAnswerTile>
  );
}

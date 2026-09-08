import { useRef } from 'react';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { INDEX_DECIMALS, MONEY_DECIMALS } from '@/lib/format';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { FIGURE_SIZE } from './figure-size';
import { IndicatorTile } from './IndicatorTile';
import { StatusFigure } from './StatusFigure';
import {
  COMPLETION_VARIANCE_READING,
  COST_VARIANCE_READING,
  INDICATORS,
  SCHEDULE_VARIANCE_READING,
  SUMMARY_COPY,
} from './summary-copy';
import {
  SUMMARY_REVEAL_ATTRIBUTE,
  SUMMARY_REVEAL_KEY,
  SUMMARY_REVEAL_SELECTOR,
} from './summary-motion';
import { isNothingToEvaluate, readSign } from './summary-reading';
import { SummarySection } from './SummarySection';
import { VarianceRow } from './VarianceRow';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ProjectSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  className?: string;
}

const MONEY_FIGURE_CLASS = 'text-2xl font-semibold text-ink';

const SKELETON = { HEADLINE_TILES: 2, LINES: 4, TILE_CLASS: 'h-28 w-full' } as const;

const GRID = {
  HEADLINE: 'sm:grid-cols-2',
  BASE: 'sm:grid-cols-2 xl:grid-cols-4',
  VARIANCES: 'grid-cols-1',
  FORECAST: 'sm:grid-cols-2',
  SKELETON: 'grid gap-3 sm:grid-cols-2',
} as const;

/**
 * Consolidated indicator panel of the dashboard (module M9).
 *
 * Contract: it only renders and interprets what the report brings; it never derives an
 * indicator. Consolidation happens in the API by summing money (docs/EVM_GUIA.md §4).
 */
export function ProjectSummary({ indicators, className = '', ...rest }: ProjectSummaryProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(contentRef, {
    selector: SUMMARY_REVEAL_SELECTOR,
    revealKey: indicators === null ? SUMMARY_REVEAL_KEY.LOADING : SUMMARY_REVEAL_KEY.READING,
  });

  return (
    <Card
      eyebrow={SUMMARY_COPY.EYEBROW}
      title={SUMMARY_COPY.TITLE}
      description={SUMMARY_COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      <div ref={contentRef} className="flex flex-col gap-6">
        {indicators === null ? <LoadingReading /> : <IndicatorsReading indicators={indicators} />}
      </div>
    </Card>
  );
}

function LoadingReading() {
  return (
    <div className="flex flex-col gap-4">
      <div className={GRID.SKELETON}>
        {Array.from({ length: SKELETON.HEADLINE_TILES }, (_unused, index) => (
          <Skeleton key={index} className={SKELETON.TILE_CLASS} />
        ))}
      </div>
      <SkeletonLines count={SKELETON.LINES} />
      <p className="text-sm text-ink-muted">{SUMMARY_COPY.LOADING_LABEL}</p>
    </div>
  );
}

interface ReadingProps {
  indicators: EvmIndicators;
}

function IndicatorsReading({ indicators }: ReadingProps) {
  const nothingToEvaluate = isNothingToEvaluate(indicators);

  return (
    <>
      {nothingToEvaluate && <EmptyReading />}
      <HeadlineIndices indicators={indicators} />
      {!nothingToEvaluate && (
        <>
          <BaseValues indicators={indicators} />
          <Variances indicators={indicators} />
          <Forecast indicators={indicators} />
        </>
      )}
      <SummaryNotes notes={indicators.notes} />
    </>
  );
}

function EmptyReading() {
  return (
    <div
      {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }}
      className="flex flex-col gap-2 rounded-md border border-line bg-surface-sunken p-4"
    >
      <p className="text-base font-semibold text-ink">{SUMMARY_COPY.EMPTY_HEADING}</p>
      <p className="text-sm text-ink-muted">{SUMMARY_COPY.EMPTY_BODY}</p>
    </div>
  );
}

function HeadlineIndices({ indicators }: ReadingProps) {
  return (
    <SummarySection
      heading={SUMMARY_COPY.HEADLINE_HEADING}
      hint={SUMMARY_COPY.HEADLINE_HINT}
      listClassName={GRID.HEADLINE}
    >
      <IndicatorTile meta={INDICATORS.COST_PERFORMANCE_INDEX}>
        <StatusFigure
          value={indicators.costPerformanceIndex}
          decimals={INDEX_DECIMALS}
          tone={costStatusTone(indicators.costStatus)}
          reading={COST_STATUS_LABEL[indicators.costStatus]}
          size={FIGURE_SIZE.HEADLINE}
        />
      </IndicatorTile>
      <IndicatorTile meta={INDICATORS.SCHEDULE_PERFORMANCE_INDEX}>
        <StatusFigure
          value={indicators.schedulePerformanceIndex}
          decimals={INDEX_DECIMALS}
          tone={scheduleStatusTone(indicators.scheduleStatus)}
          reading={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
          size={FIGURE_SIZE.HEADLINE}
        />
      </IndicatorTile>
    </SummarySection>
  );
}

function BaseValues({ indicators }: ReadingProps) {
  return (
    <SummarySection
      heading={SUMMARY_COPY.BASE_HEADING}
      hint={SUMMARY_COPY.BASE_HINT}
      listClassName={GRID.BASE}
    >
      <IndicatorTile meta={INDICATORS.PLANNED_VALUE}>
        <AnimatedNumber
          value={indicators.plannedValue}
          decimals={MONEY_DECIMALS}
          className={MONEY_FIGURE_CLASS}
        />
      </IndicatorTile>
      <IndicatorTile meta={INDICATORS.EARNED_VALUE}>
        <AnimatedNumber
          value={indicators.earnedValue}
          decimals={MONEY_DECIMALS}
          className={MONEY_FIGURE_CLASS}
        />
      </IndicatorTile>
      <IndicatorTile meta={INDICATORS.ACTUAL_COST}>
        <AnimatedNumber
          value={indicators.actualCost}
          decimals={MONEY_DECIMALS}
          className={MONEY_FIGURE_CLASS}
        />
      </IndicatorTile>
      <IndicatorTile meta={INDICATORS.BUDGET_AT_COMPLETION}>
        <AnimatedNumber
          value={indicators.budgetAtCompletion}
          decimals={MONEY_DECIMALS}
          className={MONEY_FIGURE_CLASS}
        />
      </IndicatorTile>
    </SummarySection>
  );
}

function Variances({ indicators }: ReadingProps) {
  return (
    <SummarySection
      heading={SUMMARY_COPY.VARIANCE_HEADING}
      hint={SUMMARY_COPY.VARIANCE_HINT}
      listClassName={GRID.VARIANCES}
    >
      <VarianceRow
        meta={INDICATORS.COST_VARIANCE}
        value={indicators.costVariance}
        reading={readSign(indicators.costVariance, COST_VARIANCE_READING)}
      />
      <VarianceRow
        meta={INDICATORS.SCHEDULE_VARIANCE}
        value={indicators.scheduleVariance}
        reading={readSign(indicators.scheduleVariance, SCHEDULE_VARIANCE_READING)}
      />
    </SummarySection>
  );
}

function Forecast({ indicators }: ReadingProps) {
  const completionReading = readSign(indicators.varianceAtCompletion, COMPLETION_VARIANCE_READING);

  return (
    <SummarySection
      heading={SUMMARY_COPY.FORECAST_HEADING}
      hint={SUMMARY_COPY.FORECAST_HINT}
      listClassName={GRID.FORECAST}
    >
      <IndicatorTile meta={INDICATORS.ESTIMATE_AT_COMPLETION}>
        <AnimatedNumber
          value={indicators.estimateAtCompletion}
          decimals={MONEY_DECIMALS}
          className={MONEY_FIGURE_CLASS}
        />
      </IndicatorTile>
      <IndicatorTile meta={INDICATORS.VARIANCE_AT_COMPLETION}>
        <StatusFigure
          value={indicators.varianceAtCompletion}
          decimals={MONEY_DECIMALS}
          tone={completionReading.tone}
          reading={completionReading.label}
        />
      </IndicatorTile>
    </SummarySection>
  );
}

interface SummaryNotesProps {
  notes: readonly string[];
}

function SummaryNotes({ notes }: SummaryNotesProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <section
      {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }}
      className="flex flex-col gap-1 border-t border-line pt-4"
    >
      <h3 className="text-sm font-semibold text-ink">{SUMMARY_COPY.NOTES_HEADING}</h3>
      <ul className="flex flex-col gap-1 text-sm text-ink-muted">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}

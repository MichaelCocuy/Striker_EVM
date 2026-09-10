import { useRef } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import {
  COST_STATUS_LABEL,
  costStatusTone,
  SCHEDULE_STATUS_LABEL,
  scheduleStatusTone,
} from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { BAND_COPY } from './band-copy';
import { BAND_GRADIENT } from './band-tokens';
import { BandConclusion } from './BandConclusion';
import { BandForecast } from './BandForecast';
import { BandGauge } from './BandGauge';
import { BandIndexTable } from './BandIndexTable';
import { BandOrbit } from './BandOrbit';
import {
  SUMMARY_REVEAL_ATTRIBUTE,
  SUMMARY_REVEAL_KEY,
  SUMMARY_REVEAL_SELECTOR,
} from './summary-motion';
import { VERDICT_LEVEL_LABEL } from './verdict-copy';
import { readBand } from './verdict-reading';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';
import type { HTMLAttributes, RefObject } from 'react';

/** The band renders its own conclusion, so the HTML `title` attribute is not accepted. */
export interface ProjectReadingBandProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  /** Activities as the report returns them; they say which one carries the deviation. */
  activities: readonly EvmActivityReport[];
  className?: string;
}

const BAND_CLASS = 'relative overflow-hidden rounded-lg px-[22px] py-5';
const CELLS_CLASS = 'relative grid min-w-0 items-center gap-5';
/** Four cells at the 210px minimum of the handoff; one cell when there is nothing to read. */
const GRID_CLASS = {
  ANSWERS: 'grid-cols-[repeat(auto-fit,minmax(210px,1fr))]',
  EMPTY: 'grid-cols-1',
} as const;

const SKELETON = {
  CELLS: 4,
  CELL_CLASS: 'h-24 w-full',
} as const;

/**
 * Reading band of the project dashboard (handoff §3.1). It supersedes the old "Consolidado"
 * panel: instead of every indicator at the same visual weight, the navy band answers in one
 * sentence, shows the two indices as gauges against their 1.0 reference and closes with the
 * forecast.
 *
 * Contract: it only renders and interprets what the report brings; it never derives an
 * indicator. The sentence is looked up by the pair of statuses the report already decided,
 * and an index that is not computable leaves its arc undrawn instead of sweeping to zero.
 */
export function ProjectReadingBand({
  indicators,
  activities,
  className = '',
  ...rest
}: ProjectReadingBandProps) {
  const cellsRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(cellsRef, {
    selector: SUMMARY_REVEAL_SELECTOR,
    revealKey: indicators === null ? SUMMARY_REVEAL_KEY.LOADING : SUMMARY_REVEAL_KEY.READING,
  });

  return (
    <section
      aria-label={BAND_COPY.REGION_LABEL}
      className={`${BAND_CLASS} ${className}`}
      style={{ backgroundImage: BAND_GRADIENT }}
      {...rest}
    >
      <BandOrbit />
      {indicators === null ? (
        <LoadingCells cellsRef={cellsRef} />
      ) : (
        <ReadingCells cellsRef={cellsRef} indicators={indicators} activities={activities} />
      )}
    </section>
  );
}

interface CellsProps {
  cellsRef: RefObject<HTMLDivElement>;
}

function LoadingCells({ cellsRef }: CellsProps) {
  return (
    <div ref={cellsRef} className={`${CELLS_CLASS} ${GRID_CLASS.ANSWERS}`}>
      {Array.from({ length: SKELETON.CELLS }, (_unused, index) => (
        <Skeleton key={index} className={SKELETON.CELL_CLASS} />
      ))}
      <p className="sr-only">{BAND_COPY.LOADING_LABEL}</p>
    </div>
  );
}

interface ReadingCellsProps extends CellsProps {
  indicators: EvmIndicators;
  activities: readonly EvmActivityReport[];
}

function ReadingCells({ cellsRef, indicators, activities }: ReadingCellsProps) {
  const reading = readBand(indicators, activities);
  const gridClass = reading.hasAnswers ? GRID_CLASS.ANSWERS : GRID_CLASS.EMPTY;

  return (
    <div ref={cellsRef} className={`${CELLS_CLASS} ${gridClass}`}>
      <div {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }} className="min-w-0">
        <BandConclusion
          headline={reading.headline}
          detail={reading.detail}
          notes={indicators.notes}
        />
      </div>
      {reading.hasAnswers && (
        <>
          <p className="sr-only">
            {`${BAND_COPY.OVERLINE}: ${VERDICT_LEVEL_LABEL[reading.level]}`}
          </p>
          <div {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }} className="min-w-0">
            <BandGauge
              name={INDICATORS.COST_PERFORMANCE_INDEX.acronym}
              value={indicators.costPerformanceIndex}
              tone={costStatusTone(indicators.costStatus)}
              statusLabel={COST_STATUS_LABEL[indicators.costStatus]}
            />
          </div>
          <div {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }} className="min-w-0">
            <BandGauge
              name={INDICATORS.SCHEDULE_PERFORMANCE_INDEX.acronym}
              value={indicators.schedulePerformanceIndex}
              tone={scheduleStatusTone(indicators.scheduleStatus)}
              statusLabel={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
            />
          </div>
          <div {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }} className="min-w-0">
            <BandForecast indicators={indicators} />
          </div>
          <BandIndexTable indicators={indicators} />
        </>
      )}
    </div>
  );
}

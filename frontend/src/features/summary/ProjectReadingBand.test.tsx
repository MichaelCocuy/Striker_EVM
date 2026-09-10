import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import {
  COST_STATUS_LABEL,
  costStatusTone,
  EVM_TONE,
  EVM_TONE_LABEL,
  SCHEDULE_STATUS_LABEL,
  scheduleStatusTone,
} from '@/evm/tone';
import { NOT_COMPUTABLE } from '@/lib/format';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { BAND_COPY } from './band-copy';
import { readDeviationFocus } from './deviation-focus';
import { ProjectReadingBand } from './ProjectReadingBand';
import {
  COMPLETION_VARIANCE_SHORT_READING,
  EMPTY_READING_COPY,
  FORECAST_REASON_COPY,
  VERDICT_BY_STATUS,
  VERDICT_LEVEL,
  VERDICT_LEVEL_LABEL,
  NOTES_HEADING,
} from './verdict-copy';

import type { EvmIndicators } from '@/api/types';

const REPORT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;
const ACTIVITIES = evmReportFixture.activities;

const SKELETON_SELECTOR = '.skeleton';

/** Figures of docs/api/fixtures/evm-report.json as lib/format.ts writes them (es-CO). */
const FIGURES = {
  COST_PERFORMANCE_INDEX: '0,9206',
  SCHEDULE_PERFORMANCE_INDEX: '0,9063',
  ESTIMATE_AT_COMPLETION: '65.172,41',
  VARIANCE_AT_COMPLETION: '-5.172,41',
} as const;

const BAD_VERDICT = VERDICT_BY_STATUS[COST_STATUS.OVER_BUDGET][SCHEDULE_STATUS.BEHIND_SCHEDULE];
const SAVING_WHILE_LATE_VERDICT =
  VERDICT_BY_STATUS[COST_STATUS.UNDER_BUDGET][SCHEDULE_STATUS.BEHIND_SCHEDULE];
const GOOD_VERDICT = VERDICT_BY_STATUS[COST_STATUS.UNDER_BUDGET][SCHEDULE_STATUS.AHEAD_OF_SCHEDULE];

const COST_STATUSES = Object.values(COST_STATUS);
const SCHEDULE_STATUSES = Object.values(SCHEDULE_STATUS);
const OPTIMISTIC_LEVELS: string[] = [VERDICT_LEVEL.GOOD, VERDICT_LEVEL.ON_PLAN];

function reportWith(overrides: Partial<EvmIndicators>): EvmIndicators {
  return { ...REPORT_INDICATORS, ...overrides };
}

function renderBand(indicators: EvmIndicators | null, activities = ACTIVITIES) {
  return render(<ProjectReadingBand indicators={indicators} activities={activities} />);
}

/** The hidden table that carries CPI and SPI as text, because the gauges are pictures. */
function indexTable(): HTMLElement {
  return screen.getByRole('table', { name: BAND_COPY.INDICATORS_LABEL });
}

describe('ProjectReadingBand with the shared EVM report fixture', () => {
  it('answers in one sentence how the project is going', () => {
    renderBand(REPORT_INDICATORS);

    expect(screen.getByText(BAD_VERDICT.headline)).toBeInTheDocument();
    expect(BAD_VERDICT.headline).toBe(
      'Gasta más de lo que avanza, y el atraso es lo que empuja el sobrecosto.',
    );
  });

  it('names the activity that carries the deviation, with its weight in the budget', () => {
    renderBand(REPORT_INDICATORS);

    const detail = readDeviationFocus(REPORT_INDICATORS, ACTIVITIES);
    expect(screen.getByText(detail)).toBeInTheDocument();
    expect(detail).toContain('Desarrollo');
    expect(detail).toContain('67%');
  });

  it('draws the two gauges with the reported indices and their interpretation', () => {
    renderBand(REPORT_INDICATORS);

    /** Twice each: once inside the arc, once in the hidden table beside it. */
    expect(screen.getAllByText(FIGURES.COST_PERFORMANCE_INDEX)).toHaveLength(2);
    expect(screen.getAllByText(FIGURES.SCHEDULE_PERFORMANCE_INDEX)).toHaveLength(2);
    expect(
      screen.getByText(`CPI · ${COST_STATUS_LABEL[COST_STATUS.OVER_BUDGET]}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`SPI · ${SCHEDULE_STATUS_LABEL[SCHEDULE_STATUS.BEHIND_SCHEDULE]}`),
    ).toBeInTheDocument();
  });

  it('closes with the forecast and reads the sign of its variance', () => {
    renderBand(REPORT_INDICATORS);

    expect(screen.getByText(FIGURES.ESTIMATE_AT_COMPLETION)).toBeInTheDocument();
    expect(screen.getByText(FIGURES.VARIANCE_AT_COMPLETION)).toBeInTheDocument();
    expect(screen.getByText(COMPLETION_VARIANCE_SHORT_READING.NEGATIVE)).toBeInTheDocument();
  });

  it('ships the two indices as text, since a gauge is a picture', () => {
    renderBand(REPORT_INDICATORS);

    const table = indexTable();
    expect(within(table).getByText(FIGURES.COST_PERFORMANCE_INDEX)).toBeInTheDocument();
    expect(within(table).getByText(FIGURES.SCHEDULE_PERFORMANCE_INDEX)).toBeInTheDocument();
    expect(within(table).getByText(COST_STATUS_LABEL[COST_STATUS.OVER_BUDGET])).toBeInTheDocument();
    expect(
      within(table).getByText(SCHEDULE_STATUS_LABEL[SCHEDULE_STATUS.BEHIND_SCHEDULE]),
    ).toBeInTheDocument();
  });

  it('states the overall reading in words, so colour is never the only signal', () => {
    renderBand(REPORT_INDICATORS);

    expect(
      screen.getByText(`${BAND_COPY.OVERLINE}: ${VERDICT_LEVEL_LABEL[VERDICT_LEVEL.BAD]}`),
    ).toBeInTheDocument();
  });
});

describe('ProjectReadingBand with a project that saved money by not doing the work', () => {
  const SAVING_WHILE_LATE_INDICATORS = reportWith({
    costVariance: 2200,
    scheduleVariance: -4500,
    costPerformanceIndex: 1.2136,
    schedulePerformanceIndex: 0.7353,
    estimateAtCompletion: 24720.5,
    varianceAtCompletion: 5279.5,
    costStatus: COST_STATUS.UNDER_BUDGET,
    scheduleStatus: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  });

  it('reads it as a warning and not as good news', () => {
    renderBand(SAVING_WHILE_LATE_INDICATORS);

    expect(screen.getByText(SAVING_WHILE_LATE_VERDICT.headline)).toBeInTheDocument();
    expect(screen.queryByText(GOOD_VERDICT.headline)).not.toBeInTheDocument();
    expect(SAVING_WHILE_LATE_VERDICT.level).toBe(VERDICT_LEVEL.WARNING);
  });

  it('has a distinct verdict for every combination of cost and schedule status', () => {
    const verdicts = COST_STATUSES.flatMap((costStatus) =>
      SCHEDULE_STATUSES.map((scheduleStatus) => VERDICT_BY_STATUS[costStatus][scheduleStatus]),
    );

    expect(verdicts).toHaveLength(COST_STATUSES.length * SCHEDULE_STATUSES.length);
    expect(new Set(verdicts.map((verdict) => verdict.headline)).size).toBe(verdicts.length);
  });

  it('never reads optimistically when one of the two traffic lights is red', () => {
    for (const costStatus of COST_STATUSES) {
      for (const scheduleStatus of SCHEDULE_STATUSES) {
        const isRed =
          costStatusTone(costStatus) === EVM_TONE.BAD ||
          scheduleStatusTone(scheduleStatus) === EVM_TONE.BAD;
        if (isRed) {
          expect(OPTIMISTIC_LEVELS).not.toContain(
            VERDICT_BY_STATUS[costStatus][scheduleStatus].level,
          );
        }
      }
    }
  });
});

describe('ProjectReadingBand with indices that are not computable', () => {
  it('shows a dash and "No aplica" instead of an index of zero', () => {
    renderBand(
      reportWith({
        costPerformanceIndex: null,
        schedulePerformanceIndex: null,
        estimateAtCompletion: null,
        varianceAtCompletion: null,
        costStatus: COST_STATUS.NOT_APPLICABLE,
        scheduleStatus: SCHEDULE_STATUS.NOT_APPLICABLE,
      }),
    );

    const notApplicable = EVM_TONE_LABEL[EVM_TONE.NA];
    expect(screen.getByText(`CPI · ${notApplicable}`)).toBeInTheDocument();
    expect(screen.getByText(`SPI · ${notApplicable}`)).toBeInTheDocument();
    expect(screen.getAllByText(NOT_COMPUTABLE).length).toBeGreaterThan(0);
    expect(screen.queryByText('0,0000')).not.toBeInTheDocument();
  });

  it('says why the closing cost cannot be projected', () => {
    renderBand(
      reportWith({
        costPerformanceIndex: null,
        estimateAtCompletion: null,
        varianceAtCompletion: null,
        costStatus: COST_STATUS.NOT_APPLICABLE,
      }),
    );

    expect(screen.getByText(FORECAST_REASON_COPY.NO_COST)).toBeInTheDocument();
  });

  it('distinguishes no cost from no progress', () => {
    renderBand(
      reportWith({
        costPerformanceIndex: 0,
        estimateAtCompletion: null,
        varianceAtCompletion: null,
      }),
    );

    expect(screen.getByText(FORECAST_REASON_COPY.NO_PROGRESS)).toBeInTheDocument();
  });
});

describe('ProjectReadingBand with a project without activities', () => {
  it('says plainly that there is nothing to evaluate, and draws no gauge', () => {
    renderBand(EMPTY_PROJECT_INDICATORS, []);

    expect(screen.getByText(EMPTY_READING_COPY.HEADING)).toBeInTheDocument();
    expect(screen.getByText(EMPTY_READING_COPY.BODY)).toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: BAND_COPY.INDICATORS_LABEL }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(NOT_COMPUTABLE)).not.toBeInTheDocument();
  });

  it('keeps the notes the report attaches about why nothing applies', () => {
    renderBand(EMPTY_PROJECT_INDICATORS, []);

    expect(EMPTY_PROJECT_INDICATORS.notes.length).toBeGreaterThan(0);
    expect(screen.getByText(NOTES_HEADING)).toBeInTheDocument();
    for (const note of EMPTY_PROJECT_INDICATORS.notes) {
      expect(screen.getByText(note)).toBeInTheDocument();
    }
  });
});

describe('ProjectReadingBand while the report loads', () => {
  it('shows skeletons shaped like its four cells and no figures', () => {
    const { container } = renderBand(null, []);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.getByText(BAND_COPY.LOADING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(FIGURES.COST_PERFORMANCE_INDEX)).not.toBeInTheDocument();
    expect(screen.queryByText(BAD_VERDICT.headline)).not.toBeInTheDocument();
  });
});

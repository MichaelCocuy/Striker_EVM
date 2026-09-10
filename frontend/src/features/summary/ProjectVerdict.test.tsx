import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import {
  COST_STATUS_LABEL,
  EVM_TONE,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { NOT_COMPUTABLE } from '@/lib/format';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { ProjectVerdict } from './ProjectVerdict';
import { INDICATORS, SUMMARY_COPY } from './summary-copy';
import {
  COMPLETION_VARIANCE_SHORT_READING,
  CONSEQUENCE_COPY,
  COST_VARIANCE_SHORT_READING,
  SCHEDULE_VARIANCE_SHORT_READING,
  VERDICT_BY_STATUS,
  VERDICT_COPY,
  VERDICT_LEVEL,
  VERDICT_LEVEL_LABEL,
  VERDICT_LEVEL_TONE,
} from './verdict-copy';

import type { EvmIndicators } from '@/api/types';

const REPORT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;

const SKELETON_SELECTOR = '.skeleton';

/** Figures of docs/api/fixtures/evm-report.json as lib/format.ts writes them (es-CO). */
const FIGURES = {
  COST_PERFORMANCE_INDEX: '0,9206',
  SCHEDULE_PERFORMANCE_INDEX: '0,9063',
  ESTIMATE_AT_COMPLETION: '65.172,41',
  BUDGET_AT_COMPLETION: '60.000,00',
  COMPLETION_GAP: '5.172,41',
} as const;

/** The consequence in money of the fixture project (docs/EVM_GUIA.md §6.8). */
const EXPECTED_CONSEQUENCE = `Si sigue así terminará costando ${FIGURES.ESTIMATE_AT_COMPLETION} en vez de ${FIGURES.BUDGET_AT_COMPLETION}: ${FIGURES.COMPLETION_GAP} por encima.`;

const BAD_VERDICT = VERDICT_BY_STATUS[COST_STATUS.OVER_BUDGET][SCHEDULE_STATUS.BEHIND_SCHEDULE];
const SAVING_WHILE_LATE_VERDICT =
  VERDICT_BY_STATUS[COST_STATUS.UNDER_BUDGET][SCHEDULE_STATUS.BEHIND_SCHEDULE];
const GOOD_VERDICT = VERDICT_BY_STATUS[COST_STATUS.UNDER_BUDGET][SCHEDULE_STATUS.AHEAD_OF_SCHEDULE];

const COST_STATUSES = Object.values(COST_STATUS);
const SCHEDULE_STATUSES = Object.values(SCHEDULE_STATUS);

function reportWith(overrides: Partial<EvmIndicators>): EvmIndicators {
  return { ...REPORT_INDICATORS, ...overrides };
}

/**
 * A project that saved money because it did not do the work: the case of "Rediseño del
 * intranet" in docs/EVM_GUIA.md §9, where the green cost light must not read as good news.
 */
const SAVING_WHILE_LATE_INDICATORS = reportWith({
  budgetAtCompletion: 30000,
  plannedValue: 17000,
  earnedValue: 12500,
  actualCost: 10300,
  costVariance: 2200,
  scheduleVariance: -4500,
  costPerformanceIndex: 1.2136,
  schedulePerformanceIndex: 0.7353,
  estimateAtCompletion: 24720.5,
  varianceAtCompletion: 5279.5,
  costStatus: COST_STATUS.UNDER_BUDGET,
  scheduleStatus: SCHEDULE_STATUS.BEHIND_SCHEDULE,
});

describe('ProjectVerdict', () => {
  it('says in words that the fixture project is going badly, late and over budget', () => {
    render(<ProjectVerdict indicators={REPORT_INDICATORS} />);

    expect(screen.getByText(BAD_VERDICT.headline)).toBeInTheDocument();
    expect(BAD_VERDICT.headline).toMatch(/va mal/i);
    expect(BAD_VERDICT.headline).toMatch(/atrasado/i);
    expect(BAD_VERDICT.headline).toMatch(/sobre presupuesto/i);
    expect(screen.getByText(VERDICT_LEVEL_LABEL[VERDICT_LEVEL.BAD])).toBeInTheDocument();
  });

  it('spells out the consequence in money of going on like this', () => {
    render(<ProjectVerdict indicators={REPORT_INDICATORS} />);

    expect(screen.getByText(EXPECTED_CONSEQUENCE)).toBeInTheDocument();
    expect(EXPECTED_CONSEQUENCE).toContain(FIGURES.ESTIMATE_AT_COMPLETION);
    expect(EXPECTED_CONSEQUENCE).toContain(FIGURES.BUDGET_AT_COMPLETION);
    expect(EXPECTED_CONSEQUENCE).toContain(FIGURES.COMPLETION_GAP);
  });

  it('answers the three questions with the indicator that answers each one', () => {
    render(<ProjectVerdict indicators={REPORT_INDICATORS} />);

    for (const question of [
      VERDICT_COPY.COST_QUESTION,
      VERDICT_COPY.SCHEDULE_QUESTION,
      VERDICT_COPY.FORECAST_QUESTION,
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
    for (const meta of [
      INDICATORS.COST_PERFORMANCE_INDEX,
      INDICATORS.SCHEDULE_PERFORMANCE_INDEX,
      INDICATORS.ESTIMATE_AT_COMPLETION,
    ]) {
      expect(screen.getByText(meta.acronym)).toBeInTheDocument();
      expect(screen.getByText(meta.name)).toBeInTheDocument();
      expect(screen.getByText(meta.help)).toBeInTheDocument();
    }
    expect(screen.getByText(FIGURES.COST_PERFORMANCE_INDEX)).toBeInTheDocument();
    expect(screen.getByText(FIGURES.SCHEDULE_PERFORMANCE_INDEX)).toBeInTheDocument();
    expect(screen.getByText(FIGURES.ESTIMATE_AT_COMPLETION)).toBeInTheDocument();
    expect(screen.getByText(FIGURES.BUDGET_AT_COMPLETION)).toBeInTheDocument();
  });

  it('reads the traffic light of each answer and the sign of the money behind it', () => {
    render(<ProjectVerdict indicators={REPORT_INDICATORS} />);

    expect(screen.getByText(COST_STATUS_LABEL[COST_STATUS.OVER_BUDGET])).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_STATUS_LABEL[SCHEDULE_STATUS.BEHIND_SCHEDULE]),
    ).toBeInTheDocument();
    expect(screen.getByText(COST_VARIANCE_SHORT_READING.NEGATIVE)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_VARIANCE_SHORT_READING.NEGATIVE)).toBeInTheDocument();
    expect(screen.getAllByText(COMPLETION_VARIANCE_SHORT_READING.NEGATIVE).length).toBeGreaterThan(
      0,
    );
  });

  it('reads a saving with a delay as a warning and not as good news', () => {
    render(<ProjectVerdict indicators={SAVING_WHILE_LATE_INDICATORS} />);

    expect(screen.getByText(SAVING_WHILE_LATE_VERDICT.headline)).toBeInTheDocument();
    expect(screen.getByText(VERDICT_LEVEL_LABEL[VERDICT_LEVEL.WARNING])).toBeInTheDocument();
    expect(screen.queryByText(GOOD_VERDICT.headline)).not.toBeInTheDocument();
    expect(screen.queryByText(VERDICT_LEVEL_LABEL[VERDICT_LEVEL.GOOD])).not.toBeInTheDocument();
    expect(SAVING_WHILE_LATE_VERDICT.level).toBe(VERDICT_LEVEL.WARNING);
    expect(VERDICT_LEVEL_TONE[SAVING_WHILE_LATE_VERDICT.level]).toBe(EVM_TONE.BAD);
  });

  it('has a verdict for every combination of cost and schedule status', () => {
    const headlines = COST_STATUSES.flatMap((costStatus) =>
      SCHEDULE_STATUSES.map((scheduleStatus) => VERDICT_BY_STATUS[costStatus][scheduleStatus]),
    );

    expect(headlines).toHaveLength(COST_STATUSES.length * SCHEDULE_STATUSES.length);
    for (const verdict of headlines) {
      expect(verdict.headline.length).toBeGreaterThan(0);
    }
    expect(new Set(headlines.map((verdict) => verdict.headline)).size).toBe(headlines.length);
  });

  it('never paints the band green when one of the two traffic lights is red', () => {
    for (const costStatus of COST_STATUSES) {
      for (const scheduleStatus of SCHEDULE_STATUSES) {
        const isRed =
          costStatusTone(costStatus) === EVM_TONE.BAD ||
          scheduleStatusTone(scheduleStatus) === EVM_TONE.BAD;
        if (isRed) {
          const { level } = VERDICT_BY_STATUS[costStatus][scheduleStatus];
          expect(VERDICT_LEVEL_TONE[level]).toBe(EVM_TONE.BAD);
        }
      }
    }
  });

  it('says plainly that there is nothing to evaluate instead of showing dashes', () => {
    render(<ProjectVerdict indicators={EMPTY_PROJECT_INDICATORS} />);

    expect(screen.getByText(SUMMARY_COPY.EMPTY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY_COPY.EMPTY_BODY)).toBeInTheDocument();
    expect(screen.getByText(VERDICT_LEVEL_LABEL[VERDICT_LEVEL.UNKNOWN])).toBeInTheDocument();
    expect(screen.queryByText(VERDICT_COPY.COST_QUESTION)).not.toBeInTheDocument();
    expect(screen.queryByText(NOT_COMPUTABLE)).not.toBeInTheDocument();
  });

  it('explains why the closing cost cannot be projected without registered costs', () => {
    render(
      <ProjectVerdict
        indicators={reportWith({
          costPerformanceIndex: null,
          estimateAtCompletion: null,
          varianceAtCompletion: null,
          costStatus: COST_STATUS.NOT_APPLICABLE,
        })}
      />,
    );

    expect(screen.getByText(CONSEQUENCE_COPY.NO_COST_REASON)).toBeInTheDocument();
  });

  it('explains why the closing cost cannot be projected without real progress', () => {
    render(
      <ProjectVerdict
        indicators={reportWith({
          costPerformanceIndex: 0,
          estimateAtCompletion: null,
          varianceAtCompletion: null,
        })}
      />,
    );

    expect(screen.getByText(CONSEQUENCE_COPY.NO_PROGRESS_REASON)).toBeInTheDocument();
  });

  it('shows skeletons shaped like the band while the report is loading', () => {
    const { container } = render(<ProjectVerdict indicators={null} />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.getByText(VERDICT_COPY.LOADING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(BAD_VERDICT.headline)).not.toBeInTheDocument();
    expect(screen.queryByText(FIGURES.COST_PERFORMANCE_INDEX)).not.toBeInTheDocument();
  });
});

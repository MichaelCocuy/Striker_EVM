import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { COST_STATUS_LABEL, EVM_TONE, EVM_TONE_LABEL, SCHEDULE_STATUS_LABEL } from '@/evm/tone';
import { NOT_COMPUTABLE } from '@/lib/format';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { ProjectSummary } from './ProjectSummary';
import {
  COMPLETION_VARIANCE_READING,
  COST_VARIANCE_READING,
  INDICATORS,
  SCHEDULE_VARIANCE_READING,
  SUMMARY_COPY,
} from './summary-copy';

const REPORT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;

const SKELETON_SELECTOR = '.skeleton';

/**
 * Consolidated figures of docs/api/fixtures/evm-report.json as lib/format.ts writes them
 * with es-CO separators (docs/EVM_GUIA.md §6.6): money with two decimals, indices with four.
 */
const CONSOLIDATED_FIGURES = {
  BUDGET_AT_COMPLETION: '60.000,00',
  PLANNED_VALUE: '32.000,00',
  EARNED_VALUE: '29.000,00',
  ACTUAL_COST: '31.500,00',
  COST_VARIANCE: '-2.500,00',
  SCHEDULE_VARIANCE: '-3.000,00',
  COST_PERFORMANCE_INDEX: '0,9206',
  SCHEDULE_PERFORMANCE_INDEX: '0,9063',
  ESTIMATE_AT_COMPLETION: '65.172,41',
  VARIANCE_AT_COMPLETION: '-5.172,41',
};

const NOT_APPLICABLE_LABEL = EVM_TONE_LABEL[EVM_TONE.NA];

describe('ProjectSummary', () => {
  it('renders the consolidated figures of the shared report fixture', () => {
    render(<ProjectSummary indicators={REPORT_INDICATORS} />);

    for (const figure of Object.values(CONSOLIDATED_FIGURES)) {
      expect(screen.getByText(figure)).toBeInTheDocument();
    }
  });

  it('labels every indicator with its acronym, its Spanish name and what it answers', () => {
    render(<ProjectSummary indicators={REPORT_INDICATORS} />);

    for (const indicator of Object.values(INDICATORS)) {
      expect(screen.getByText(indicator.acronym)).toBeInTheDocument();
      expect(screen.getByText(indicator.name)).toBeInTheDocument();
      expect(screen.getByText(indicator.help)).toBeInTheDocument();
    }
  });

  it('reads the fixture as over budget and behind schedule', () => {
    render(<ProjectSummary indicators={REPORT_INDICATORS} />);

    expect(screen.getByText(COST_STATUS_LABEL[COST_STATUS.OVER_BUDGET])).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_STATUS_LABEL[SCHEDULE_STATUS.BEHIND_SCHEDULE]),
    ).toBeInTheDocument();
    expect(screen.queryByText(SUMMARY_COPY.EMPTY_HEADING)).not.toBeInTheDocument();
  });

  it('interprets the sign of both variances and of the forecast', () => {
    render(<ProjectSummary indicators={REPORT_INDICATORS} />);

    expect(screen.getByText(COST_VARIANCE_READING.NEGATIVE)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_VARIANCE_READING.NEGATIVE)).toBeInTheDocument();
    expect(screen.getByText(COMPLETION_VARIANCE_READING.NEGATIVE)).toBeInTheDocument();
  });

  it('says there is nothing to evaluate for a project without activities', () => {
    render(<ProjectSummary indicators={EMPTY_PROJECT_INDICATORS} />);

    expect(screen.getByText(SUMMARY_COPY.EMPTY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY_COPY.EMPTY_BODY)).toBeInTheDocument();
    expect(screen.queryByText(INDICATORS.BUDGET_AT_COMPLETION.name)).not.toBeInTheDocument();
  });

  it('renders the em dash and "No aplica" for indicators that are all null', () => {
    render(<ProjectSummary indicators={EMPTY_PROJECT_INDICATORS} />);

    expect(screen.getAllByText(NOT_COMPUTABLE)).toHaveLength(2);
    expect(screen.getAllByText(NOT_APPLICABLE_LABEL)).toHaveLength(2);
    expect(COST_STATUS_LABEL[COST_STATUS.NOT_APPLICABLE]).toBe(NOT_APPLICABLE_LABEL);
    expect(SCHEDULE_STATUS_LABEL[SCHEDULE_STATUS.NOT_APPLICABLE]).toBe(NOT_APPLICABLE_LABEL);
  });

  it('renders the notes that explain why an indicator does not apply', () => {
    render(<ProjectSummary indicators={EMPTY_PROJECT_INDICATORS} />);

    expect(EMPTY_PROJECT_INDICATORS.notes.length).toBeGreaterThan(0);
    expect(screen.getByText(SUMMARY_COPY.NOTES_HEADING)).toBeInTheDocument();
    for (const note of EMPTY_PROJECT_INDICATORS.notes) {
      expect(screen.getByText(note)).toBeInTheDocument();
    }
  });

  it('shows skeletons while the report is loading', () => {
    const { container } = render(<ProjectSummary indicators={null} />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.getByText(SUMMARY_COPY.LOADING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(CONSOLIDATED_FIGURES.COST_PERFORMANCE_INDEX)).not.toBeInTheDocument();
  });
});

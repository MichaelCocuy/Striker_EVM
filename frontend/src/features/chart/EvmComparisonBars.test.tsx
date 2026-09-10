import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { EvmComparisonBars } from './EvmComparisonBars';

import type { EvmIndicators } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const PROJECT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;

/**
 * jsdom has no layout, so a bar width measures nothing. Every assertion targets the
 * description list the card is made of: its three terms, its three definitions and the two
 * readings of the gaps.
 */
function renderComparison(indicators: EvmIndicators) {
  return render(<EvmComparisonBars indicators={indicators} isLoading={false} />);
}

function termTexts(): string[] {
  return screen.getAllByRole('term').map((term) => term.textContent ?? '');
}

function definitionTexts(): string[] {
  return screen.getAllByRole('definition').map((definition) => definition.textContent ?? '');
}

describe('EvmComparisonBars with the shared EVM report fixture', () => {
  it('labels the three values in plain Spanish with their acronym', () => {
    renderComparison(PROJECT_INDICATORS);

    const [planned, earned, actual] = termTexts();
    expect(planned).toContain('Debía llevar hecho');
    expect(planned).toContain('PV');
    expect(earned).toContain('Llevo hecho');
    expect(earned).toContain('EV');
    expect(actual).toContain('He pagado');
    expect(actual).toContain('AC');
  });

  it('gives every row its money, so the three numbers reach a screen reader', () => {
    renderComparison(PROJECT_INDICATORS);

    const [planned, earned, actual] = definitionTexts();
    expect(planned).toContain('32.000,00');
    expect(earned).toContain('29.000,00');
    expect(actual).toContain('31.500,00');
  });

  it('reads the schedule gap on the earned row and the cost gap on the paid row', () => {
    renderComparison(PROJECT_INDICATORS);

    const [, earned, actual] = definitionTexts();
    expect(earned).toContain('Atraso de 3.000,00');
    expect(actual).toContain('Sobrecosto de 2.500,00');
  });

  it('keeps the gap readings out of the baseline row, which nothing is compared against', () => {
    renderComparison(PROJECT_INDICATORS);

    const [planned] = definitionTexts();
    expect(planned).not.toContain('Atraso');
    expect(planned).not.toContain('Sobrecosto');
  });
});

describe('EvmComparisonBars with a favourable project', () => {
  it('reads the gaps as an advance and a saving', () => {
    renderComparison({
      ...PROJECT_INDICATORS,
      scheduleVariance: 1000,
      costVariance: 500,
      costStatus: COST_STATUS.UNDER_BUDGET,
      scheduleStatus: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
    });

    expect(screen.getByText(/Adelanto de 1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/Ahorro de 500,00/)).toBeInTheDocument();
  });
});

describe('EvmComparisonBars with a project without activities', () => {
  it('says so instead of drawing three empty bars', () => {
    renderComparison(EMPTY_PROJECT_INDICATORS);

    expect(screen.getByText('Agrega una actividad para ver los tres valores.')).toBeInTheDocument();
    expect(screen.queryAllByRole('term')).toHaveLength(0);
  });
});

describe('EvmComparisonBars while the report loads', () => {
  it('renders skeletons and no values', () => {
    const { container } = render(<EvmComparisonBars indicators={null} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('term')).toHaveLength(0);
  });

  it('renders skeletons while the indicators are still missing', () => {
    const { container } = render(<EvmComparisonBars indicators={null} isLoading={false} />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
  });
});

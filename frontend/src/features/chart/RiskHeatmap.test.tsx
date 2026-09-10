import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS } from '@/api/types';
import { NOT_COMPUTABLE } from '@/lib/format';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { HEATMAP_COPY } from './heatmap-rows';
import { RiskHeatmap } from './RiskHeatmap';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const PROJECT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;
const ACTIVITIES = evmReportFixture.activities;

function renderHeatmap(
  activities: readonly EvmActivityReport[],
  indicators: EvmIndicators | null = PROJECT_INDICATORS,
) {
  return render(<RiskHeatmap activities={activities} indicators={indicators} isLoading={false} />);
}

function heatmap(): HTMLElement {
  return screen.getByRole('table', { name: HEATMAP_COPY.CAPTION });
}

function cellsOfRow(activityName: string): (string | null)[] {
  const row = within(heatmap()).getByRole('row', { name: new RegExp(activityName) });
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

describe('RiskHeatmap with the shared EVM report fixture', () => {
  it('gives every cell its figure and the reading that goes with it', () => {
    renderHeatmap(ACTIVITIES);

    expect(cellsOfRow('Diseño')).toEqual([
      '1,11 · Bajo presupuesto',
      '1,00 · En cronograma',
      '+1.000 · Favorable: terminará por debajo del presupuesto',
      `17% · ${HEATMAP_COPY.WEIGHT_READING}`,
    ]);
    expect(cellsOfRow('Desarrollo')).toEqual([
      '0,80 · Sobre presupuesto',
      '0,80 · Atrasado',
      '-10.000 · Desfavorable: terminará por encima del presupuesto',
      `67% · ${HEATMAP_COPY.HEAVY_WEIGHT_READING}`,
    ]);
    expect(cellsOfRow('Pruebas')).toEqual([
      '1,20 · Bajo presupuesto',
      '1,50 · Adelantado',
      '+1.667 · Favorable: terminará por debajo del presupuesto',
      `17% · ${HEATMAP_COPY.WEIGHT_READING}`,
    ]);
  });

  it('names the four dimensions and the indicator behind each one', () => {
    renderHeatmap(ACTIVITIES);

    const headers = within(heatmap())
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

    expect(headers).toEqual([
      HEATMAP_COPY.COLUMNS.ACTIVITY,
      'Costo — CPI',
      'Plazo — SPI',
      'Cierre — VAC',
      'Peso — BAC',
    ]);
  });

  it('keeps one row per activity, in report order', () => {
    renderHeatmap(ACTIVITIES);

    const names = within(heatmap())
      .getAllByRole('rowheader')
      .map((header) => header.textContent);
    expect(names).toEqual(ACTIVITIES.map((activity) => activity.name));
  });

  it('explains what the weight column is for', () => {
    renderHeatmap(ACTIVITIES);

    expect(screen.getByText(HEATMAP_COPY.FOOTNOTE)).toBeInTheDocument();
  });
});

describe('RiskHeatmap with figures that are not computable', () => {
  it('writes a dash for an index the report could not compute, never a zero', () => {
    const [design] = ACTIVITIES;
    if (design === undefined) {
      throw new Error('The fixture lost Diseño');
    }

    renderHeatmap([
      {
        ...design,
        indicators: {
          ...design.indicators,
          costPerformanceIndex: null,
          costStatus: COST_STATUS.NOT_APPLICABLE,
          varianceAtCompletion: null,
        },
      },
    ]);

    const cells = cellsOfRow(design.name);
    expect(cells[0]).toContain(NOT_COMPUTABLE);
    expect(cells[0]).not.toContain('0,00');
    expect(cells[2]).toContain(NOT_COMPUTABLE);
  });
});

describe('RiskHeatmap with a project without activities', () => {
  it('says so instead of drawing an empty grid', () => {
    renderHeatmap([], EMPTY_PROJECT_INDICATORS);

    expect(screen.getByText(HEATMAP_COPY.EMPTY)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('RiskHeatmap while the report loads', () => {
  it('renders skeletons and no cells', () => {
    const { container } = render(<RiskHeatmap activities={[]} indicators={null} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

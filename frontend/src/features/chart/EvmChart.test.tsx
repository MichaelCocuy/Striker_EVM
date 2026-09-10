import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { CHART_SERIES } from './chart-config';
import { EvmChart } from './EvmChart';

import type { EvmReport } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const LEGEND_LABEL = 'Series de la gráfica';

/**
 * jsdom has no layout, so the plot itself draws nothing measurable. Every assertion here
 * targets the accessible fallback (the hidden table) and the legend.
 */
function renderReport(report: EvmReport) {
  return render(<EvmChart activities={report.activities} isLoading={false} />);
}

function cellsOfRow(activityName: string): (string | null)[] {
  const row = screen.getByRole('row', { name: new RegExp(activityName) });
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

describe('EvmChart with the shared EVM report fixture', () => {
  it('exposes PV, EV, AC, BAC, CPI and SPI per activity in the accessible table', () => {
    renderReport(evmReportFixture);

    expect(cellsOfRow('Diseño')).toEqual([
      '10.000,00',
      '10.000,00',
      '9.000,00',
      '10.000,00',
      '1,1111',
      '1,0000',
    ]);
    expect(cellsOfRow('Desarrollo')).toEqual([
      '20.000,00',
      '16.000,00',
      '20.000,00',
      '40.000,00',
      '0,8000',
      '0,8000',
    ]);
    expect(cellsOfRow('Pruebas')).toEqual([
      '2.000,00',
      '3.000,00',
      '2.500,00',
      '10.000,00',
      '1,2000',
      '1,5000',
    ]);
  });

  it('keeps the activities in report order', () => {
    renderReport(evmReportFixture);

    const rowHeaders = screen.getAllByRole('rowheader').map((header) => header.textContent);
    expect(rowHeaders).toEqual(evmReportFixture.activities.map((activity) => activity.name));
  });

  it('describes the plot for a screen reader instead of leaving it silent', () => {
    renderReport(evmReportFixture);

    const plot = screen.getByRole('img');
    expect(plot).toHaveAccessibleName(/PV, EV y AC por actividad/);
    expect(plot).toHaveAccessibleName(/presupuesto/);
  });

  it('names the three series and the budget marker in the legend', () => {
    renderReport(evmReportFixture);

    const legend = screen.getByRole('list', { name: LEGEND_LABEL });
    for (const series of CHART_SERIES) {
      expect(within(legend).getByText(`${series.acronym} · ${series.label}`)).toBeInTheDocument();
    }
    expect(
      within(legend).getByText(
        `${INDICATORS.BUDGET_AT_COMPLETION.acronym} · ${INDICATORS.BUDGET_AT_COMPLETION.name}`,
      ),
    ).toBeInTheDocument();
  });

  it('names every column with the indicator it holds', () => {
    renderReport(evmReportFixture);

    for (const meta of [
      INDICATORS.PLANNED_VALUE,
      INDICATORS.EARNED_VALUE,
      INDICATORS.ACTUAL_COST,
      INDICATORS.BUDGET_AT_COMPLETION,
    ]) {
      expect(
        screen.getByRole('columnheader', { name: `${meta.acronym} — ${meta.name}` }),
      ).toBeInTheDocument();
    }
  });
});

describe('EvmChart with a project without activities', () => {
  it('renders the empty state instead of an axis of zeros', () => {
    renderReport(emptyEvmReportFixture);

    expect(screen.getByText('Agrega una actividad para ver la comparación.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('EvmChart while the report loads', () => {
  it('renders skeletons and no data', () => {
    const { container } = render(<EvmChart activities={[]} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NOT_COMPUTABLE } from '@/lib/format';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { CHART_SERIES } from './chart-config';
import { EvmChart } from './EvmChart';

import type { EvmReport } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const CPI_NAME = 'CPI';
const SPI_NAME = 'SPI';

/**
 * jsdom has no layout, so the plot itself draws nothing measurable. Every assertion here
 * targets the accessible fallback (the hidden table), the legend and the gauge text.
 */
function renderReport(report: EvmReport) {
  return render(
    <EvmChart
      activities={report.activities}
      indicators={report.project.indicators}
      isLoading={false}
    />,
  );
}

/** The gauge block that carries the given index name, so the two gauges cannot be confused. */
function gaugeOf(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  const block = heading.parentElement;
  if (block === null) {
    throw new Error(`Gauge ${name} has no container`);
  }
  return block;
}

function cellsOfRow(activityName: string): (string | null)[] {
  const row = screen.getByRole('row', { name: new RegExp(activityName) });
  return within(row).getAllByRole('cell').map((cell) => cell.textContent);
}

describe('EvmChart with the shared EVM report fixture', () => {
  it('exposes PV, EV, AC, CPI and SPI per activity in the accessible table', () => {
    renderReport(evmReportFixture);

    expect(cellsOfRow('Diseño')).toEqual([
      '10.000,00',
      '10.000,00',
      '9.000,00',
      '1,1111',
      '1,0000',
    ]);
    expect(cellsOfRow('Desarrollo')).toEqual([
      '20.000,00',
      '16.000,00',
      '20.000,00',
      '0,8000',
      '0,8000',
    ]);
    expect(cellsOfRow('Pruebas')).toEqual(['2.000,00', '3.000,00', '2.500,00', '1,2000', '1,5000']);
  });

  it('keeps the activities in report order', () => {
    renderReport(evmReportFixture);

    const rowHeaders = screen.getAllByRole('rowheader').map((header) => header.textContent);
    expect(rowHeaders).toEqual(evmReportFixture.activities.map((activity) => activity.name));
  });

  it('names the three series in the legend', () => {
    renderReport(evmReportFixture);

    const legend = screen.getByRole('list', { name: 'Series de la gráfica' });
    for (const series of CHART_SERIES) {
      expect(within(legend).getByText(series.label)).toBeInTheDocument();
    }
  });

  it('shows the CPI gauge with its value and interpretation', () => {
    renderReport(evmReportFixture);

    const cpi = gaugeOf(CPI_NAME);
    expect(within(cpi).getByText('0,9206')).toBeInTheDocument();
    expect(within(cpi).getByText('Sobre presupuesto')).toBeInTheDocument();
  });

  it('shows the SPI gauge with its value and interpretation', () => {
    renderReport(evmReportFixture);

    const spi = gaugeOf(SPI_NAME);
    expect(within(spi).getByText('0,9063')).toBeInTheDocument();
    expect(within(spi).getByText('Atrasado')).toBeInTheDocument();
  });
});

describe('EvmChart with a project without activities', () => {
  it('renders the empty state instead of the comparison', () => {
    renderReport(emptyEvmReportFixture);

    expect(screen.getByText('Agrega una actividad para ver la comparación.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders an index that is not computable as a dash and "No aplica", never as zero', () => {
    renderReport(emptyEvmReportFixture);

    for (const name of [CPI_NAME, SPI_NAME]) {
      const gauge = gaugeOf(name);
      expect(within(gauge).getByText(NOT_COMPUTABLE)).toBeInTheDocument();
      expect(within(gauge).getByText('No aplica')).toBeInTheDocument();
      expect(within(gauge).queryByText('0,0000')).not.toBeInTheDocument();
    }
  });
});

describe('EvmChart while the report loads', () => {
  it('renders skeletons and no data', () => {
    const { container } = render(<EvmChart activities={[]} indicators={null} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: CPI_NAME })).not.toBeInTheDocument();
  });
});

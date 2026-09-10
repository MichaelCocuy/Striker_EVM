import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NOT_COMPUTABLE } from '@/lib/format';
import { evmReportFixture } from '@/mocks/fixtures';

import { ActivityQuadrant } from './ActivityQuadrant';

import type { EvmActivityReport } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const ACTIVITIES = evmReportFixture.activities;
const QUADRANT_CAPTION = 'CPI y SPI por actividad, con su presupuesto';

function renderQuadrant(activities: readonly EvmActivityReport[]) {
  return render(<ActivityQuadrant activities={activities} isLoading={false} />);
}

function cellsOfRow(activityName: string): (string | null)[] {
  const table = screen.getByRole('table', { name: QUADRANT_CAPTION });
  const row = within(table).getByRole('row', { name: new RegExp(activityName) });
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

describe('ActivityQuadrant with the shared EVM report fixture', () => {
  it('exposes the two indices, the budget and both readings as text', () => {
    renderQuadrant(ACTIVITIES);

    expect(cellsOfRow('Diseño')).toEqual([
      '1,1111',
      '1,0000',
      '10.000,00',
      'Bajo presupuesto · En cronograma',
    ]);
    expect(cellsOfRow('Desarrollo')).toEqual([
      '0,8000',
      '0,8000',
      '40.000,00',
      'Sobre presupuesto · Atrasado',
    ]);
    expect(cellsOfRow('Pruebas')).toEqual([
      '1,2000',
      '1,5000',
      '10.000,00',
      'Bajo presupuesto · Adelantado',
    ]);
  });

  it('labels every bubble with its activity and writes the budget inside it', () => {
    renderQuadrant(ACTIVITIES);

    const plot = screen.getByRole('img');
    for (const activity of ACTIVITIES) {
      expect(within(plot).getByText(activity.name)).toBeInTheDocument();
    }
    expect(within(plot).getAllByText('10 mil')).toHaveLength(2);
    expect(within(plot).getByText('40 mil')).toBeInTheDocument();
  });

  it('marks the two references the bubbles are read against', () => {
    renderQuadrant(ACTIVITIES);

    const plot = screen.getByRole('img');
    expect(within(plot).getByText('CPI 1,0')).toBeInTheDocument();
    expect(within(plot).getByText('SPI 1,0')).toBeInTheDocument();
    expect(within(plot).getByText('SPI · cronograma')).toBeInTheDocument();
    expect(within(plot).getByText('CPI · costo')).toBeInTheDocument();
  });

  it('explains how to read the bands', () => {
    renderQuadrant(ACTIVITIES);

    expect(screen.getByText(/La banda verde es CPI por encima de 1,0/)).toBeInTheDocument();
  });
});

describe('ActivityQuadrant with an index that is not computable', () => {
  it('leaves the activity out of the plot and says so, instead of drawing a zero', () => {
    const [design, development, testing] = ACTIVITIES;
    if (design === undefined || development === undefined || testing === undefined) {
      throw new Error('The fixture lost one of its activities');
    }

    renderQuadrant([
      {
        ...design,
        indicators: {
          ...design.indicators,
          costPerformanceIndex: null,
          schedulePerformanceIndex: null,
        },
      },
      development,
      testing,
    ]);

    const plot = screen.getByRole('img');
    expect(within(plot).queryByText(design.name)).not.toBeInTheDocument();
    expect(within(plot).queryByText('0,0000')).not.toBeInTheDocument();
    expect(screen.getByText(/No se dibujan: Diseño/)).toBeInTheDocument();
    expect(screen.queryByText(NOT_COMPUTABLE)).not.toBeInTheDocument();
  });
});

describe('ActivityQuadrant with an off-scale activity', () => {
  it('draws it at the edge and says its position is approximate', () => {
    const [design] = ACTIVITIES;
    if (design === undefined) {
      throw new Error('The fixture lost Diseño');
    }

    renderQuadrant([
      {
        ...design,
        indicators: {
          ...design.indicators,
          costPerformanceIndex: 1.8125,
          schedulePerformanceIndex: 0.3452,
        },
      },
    ]);

    expect(screen.getByText(/Con el trazo punteado: Diseño/)).toBeInTheDocument();
    expect(screen.getByText(/aproximada/)).toBeInTheDocument();
  });
});

describe('ActivityQuadrant with a project without activities', () => {
  it('says so instead of drawing an empty scatter', () => {
    renderQuadrant([]);

    expect(screen.getByText('Agrega una actividad para ver el cuadrante.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('ActivityQuadrant while the report loads', () => {
  it('renders a placeholder of the plot height and no bubbles', () => {
    const { container } = render(<ActivityQuadrant activities={[]} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

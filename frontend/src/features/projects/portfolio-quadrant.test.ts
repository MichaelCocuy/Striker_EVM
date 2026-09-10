import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { evmReportFixture, projectFixture } from '@/mocks/fixtures';

import {
  bubbleColorToken,
  bubblePosition,
  bubbleRadius,
  isPlottable,
  QUADRANT_ORIGIN,
  QUADRANT_PLOT,
  toQuadrantBubbles,
} from './portfolio-quadrant';

import type { PortfolioItem } from './portfolio-items';
import type { CostStatus, EvmIndicators, ScheduleStatus } from '@/api/types';

/**
 * The seven seeded projects that have activities, with the coordinates the design handoff
 * publishes for them ("2 · Portafolio", «Coordenadas exactas de los siete proyectos»). The
 * indices come from backend/db/init.sql, so every row can be checked by hand.
 */
const SEEDED_BUBBLES = [
  {
    number: '01',
    name: 'Portal de clientes',
    cpi: 0.9206,
    spi: 0.9063,
    bac: 60000,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
    centerX: 190,
    centerY: 184,
    radius: 11,
    colorToken: '--evm-bad',
    offScale: false,
    halo: false,
  },
  {
    number: '02',
    name: 'Migración a la nube',
    cpi: 1.1636,
    spi: 1.113,
    bac: 40000,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
    centerX: 238,
    centerY: 142,
    radius: 9,
    colorToken: '--evm-good',
    offScale: false,
    halo: false,
  },
  {
    number: '03',
    name: 'Integración de pagos',
    cpi: 0.7712,
    spi: 1.3,
    bac: 50000,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
    centerX: 282,
    centerY: 209,
    radius: 10,
    colorToken: '--evm-bad',
    offScale: false,
    halo: false,
  },
  {
    number: '04',
    name: 'Rediseño del intranet',
    cpi: 1.2136,
    spi: 0.7353,
    bac: 30000,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
    centerX: 151,
    centerY: 133,
    radius: 8,
    colorToken: '--evm-neutral',
    offScale: false,
    halo: false,
  },
  {
    number: '05',
    name: 'Cumplimiento normativo',
    cpi: 1,
    spi: 1,
    bac: 40000,
    cost: COST_STATUS.ON_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
    centerX: 212,
    centerY: 170,
    radius: 9,
    colorToken: '--accent',
    offScale: false,
    halo: true,
  },
  {
    number: '06',
    name: 'App móvil de campo',
    cpi: 1.8125,
    spi: 0.3452,
    bac: 43000,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
    centerX: 72,
    centerY: 44,
    radius: 9,
    colorToken: '--evm-neutral',
    offScale: true,
    halo: false,
  },
  {
    number: '07',
    name: 'Certificación ISO 27001',
    cpi: 0.8929,
    spi: 1,
    bac: 50000,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
    centerX: 212,
    centerY: 188,
    radius: 10,
    colorToken: '--evm-bad',
    offScale: false,
    halo: true,
  },
] as const;

interface IndicatorOverrides {
  budgetAtCompletion?: number;
  costPerformanceIndex?: number | null;
  schedulePerformanceIndex?: number | null;
  costStatus?: CostStatus;
  scheduleStatus?: ScheduleStatus;
}

function indicators(overrides: IndicatorOverrides): EvmIndicators {
  return { ...evmReportFixture.project.indicators, ...overrides };
}

function item(number: string, name: string, overrides: IndicatorOverrides | null): PortfolioItem {
  return {
    number,
    entry: {
      project: { ...projectFixture, id: `project-${number}`, name },
      indicators: overrides === null ? null : indicators(overrides),
    },
  };
}

describe('quadrant bubble geometry', () => {
  it.each(SEEDED_BUBBLES)(
    'places $number · $name at the coordinates of the handoff',
    ({ cpi, spi, bac, centerX, centerY, radius, offScale }) => {
      const bubbleR = bubbleRadius(bac);
      expect(bubbleR).toBe(radius);

      const position = bubblePosition(cpi, spi, bubbleR);
      expect(position.centerX).toBe(centerX);
      expect(position.centerY).toBe(centerY);
      expect(position.isOffScale).toBe(offScale);
    },
  );

  it('caps the radius so two projects of similar indices cannot cover each other', () => {
    expect(bubbleRadius(1000)).toBe(8);
    expect(bubbleRadius(1000000)).toBe(11);
  });

  it('keeps an off-scale bubble inside the plot area', () => {
    const radius = bubbleRadius(43000);
    const position = bubblePosition(1.8125, 0.3452, radius);

    expect(position.centerX - radius).toBeGreaterThan(QUADRANT_PLOT.LEFT);
    expect(position.centerY - radius).toBeGreaterThan(QUADRANT_PLOT.TOP);
    expect(position.centerX + radius).toBeLessThan(QUADRANT_PLOT.RIGHT);
    expect(position.centerY + radius).toBeLessThan(QUADRANT_PLOT.BOTTOM);
  });
});

describe('quadrant bubble tone', () => {
  it.each(SEEDED_BUBBLES)('inks $number · $name from its two statuses', (seeded) => {
    expect(
      bubbleColorToken(indicators({ costStatus: seeded.cost, scheduleStatus: seeded.schedule })),
    ).toBe(seeded.colorToken);
  });

  it('falls back to the not-applicable ink when a status is not applicable', () => {
    expect(
      bubbleColorToken(
        indicators({
          costStatus: COST_STATUS.NOT_APPLICABLE,
          scheduleStatus: SCHEDULE_STATUS.NOT_APPLICABLE,
        }),
      ),
    ).toBe('--evm-na');
  });
});

describe('toQuadrantBubbles', () => {
  const plottable = item('01', 'Portal de clientes', {
    budgetAtCompletion: 60000,
    costPerformanceIndex: 0.9206,
    schedulePerformanceIndex: 0.9063,
  });
  const withoutIndices = item('08', 'Tablero de indicadores', {
    budgetAtCompletion: 0,
    costPerformanceIndex: null,
    schedulePerformanceIndex: null,
    costStatus: COST_STATUS.NOT_APPLICABLE,
    scheduleStatus: SCHEDULE_STATUS.NOT_APPLICABLE,
  });
  const withoutReport = item('09', 'Reporte caído', null);

  it('draws no point for a project without indices: a bubble at zero would be a lie', () => {
    const bubbles = toQuadrantBubbles([plottable, withoutIndices, withoutReport]);

    expect(bubbles.map((bubble) => bubble.number)).toEqual(['01']);
    expect(isPlottable(withoutIndices)).toBe(false);
    expect(isPlottable(withoutReport)).toBe(false);
    expect(isPlottable(plottable)).toBe(true);
  });

  it('haloes only the bubbles that land on a reference line', () => {
    const onReference = item('05', 'Cumplimiento normativo', {
      budgetAtCompletion: 40000,
      costPerformanceIndex: 1,
      schedulePerformanceIndex: 1,
      costStatus: COST_STATUS.ON_BUDGET,
      scheduleStatus: SCHEDULE_STATUS.ON_SCHEDULE,
    });
    const [first, second] = toQuadrantBubbles([plottable, onReference]);

    expect(first?.needsHalo).toBe(false);
    expect(second?.needsHalo).toBe(true);
    expect(second?.centerX).toBe(QUADRANT_ORIGIN.X);
    expect(second?.centerY).toBe(QUADRANT_ORIGIN.Y);
  });
});

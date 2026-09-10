import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { VarianceBridge } from './VarianceBridge';

import type { EvmIndicators } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const PROJECT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;

const BRIDGE_CAPTION = 'Puente de varianzas: de lo planificado a lo gastado';
/** The five figures the bridge writes above its bars, in whole units. */
const BRIDGE_FIGURES = ['32.000', '-3.000', '29.000', '-2.500', '31.500'] as const;

/** The four base figures of the report, to the cent (docs/EVM_GUIA.md §6.6). */
const BASE_FIGURES = {
  PLANNED_VALUE: '32.000,00',
  EARNED_VALUE: '29.000,00',
  ACTUAL_COST: '31.500,00',
  BUDGET_AT_COMPLETION: '60.000,00',
} as const;

function renderBridge(indicators: EvmIndicators) {
  return render(<VarianceBridge indicators={indicators} isLoading={false} />);
}

function bridgeTable(): HTMLElement {
  return screen.getByRole('table', { name: BRIDGE_CAPTION });
}

describe('VarianceBridge with the shared EVM report fixture', () => {
  it('writes the five figures of the waterfall above their bars', () => {
    renderBridge(PROJECT_INDICATORS);

    for (const figure of BRIDGE_FIGURES) {
      expect(screen.getByText(figure)).toBeInTheDocument();
    }
  });

  it('labels every column with its acronym and what it is', () => {
    renderBridge(PROJECT_INDICATORS);

    for (const meta of [
      INDICATORS.PLANNED_VALUE,
      INDICATORS.SCHEDULE_VARIANCE,
      INDICATORS.EARNED_VALUE,
      INDICATORS.COST_VARIANCE,
      INDICATORS.ACTUAL_COST,
    ]) {
      expect(screen.getAllByText(meta.acronym).length).toBeGreaterThan(0);
    }
    /** Twice each: once under the bar, once in the hidden table's reading column. */
    for (const gloss of [
      'planificado',
      'trabajo no hecho',
      'trabajo hecho',
      'sobrecosto',
      'gastado',
    ]) {
      expect(screen.getAllByText(gloss)).toHaveLength(2);
    }
  });

  it('ships the same five amounts as text, to the cent', () => {
    renderBridge(PROJECT_INDICATORS);

    const table = bridgeTable();
    expect(within(table).getByText('32.000,00')).toBeInTheDocument();
    expect(within(table).getByText('-3.000,00')).toBeInTheDocument();
    expect(within(table).getByText('29.000,00')).toBeInTheDocument();
    expect(within(table).getByText('-2.500,00')).toBeInTheDocument();
    expect(within(table).getByText('31.500,00')).toBeInTheDocument();
  });

  it('closes with the four base figures of the report, budget included', () => {
    renderBridge(PROJECT_INDICATORS);

    /** PV, EV and AC land twice: once in the strip, once in the hidden table. */
    expect(screen.getAllByText(BASE_FIGURES.PLANNED_VALUE)).toHaveLength(2);
    expect(screen.getAllByText(BASE_FIGURES.EARNED_VALUE)).toHaveLength(2);
    expect(screen.getAllByText(BASE_FIGURES.ACTUAL_COST)).toHaveLength(2);
    /** BAC lives only here: it is the tenth indicator of the report on this dashboard. */
    expect(screen.getByText(BASE_FIGURES.BUDGET_AT_COMPLETION)).toBeInTheDocument();
    expect(screen.getByText('PV al corte')).toBeInTheDocument();
    expect(screen.getByText('BAC')).toBeInTheDocument();
  });

  it('describes the plot for a screen reader', () => {
    renderBridge(PROJECT_INDICATORS);

    expect(screen.getByRole('img')).toHaveAccessibleName(/de PV a AC/);
  });
});

describe('VarianceBridge with a favourable project', () => {
  it('reads the two jumps as an advance and a saving', () => {
    renderBridge({
      ...PROJECT_INDICATORS,
      earnedValue: 33000,
      actualCost: 30000,
      costVariance: 3000,
      scheduleVariance: 1000,
      costStatus: COST_STATUS.UNDER_BUDGET,
      scheduleStatus: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
    });

    expect(screen.getAllByText('trabajo adelantado')).toHaveLength(2);
    expect(screen.getAllByText('ahorro')).toHaveLength(2);
    expect(screen.getByText('+1.000')).toBeInTheDocument();
    expect(screen.getByText('+3.000')).toBeInTheDocument();
  });
});

describe('VarianceBridge with a project without activities', () => {
  it('says so instead of drawing five bars of zero', () => {
    renderBridge(EMPTY_PROJECT_INDICATORS);

    expect(screen.getByText('Agrega una actividad para ver el puente.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('VarianceBridge while the report loads', () => {
  it('renders skeletons and no figures', () => {
    const { container } = render(<VarianceBridge indicators={null} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders skeletons while the indicators are still missing', () => {
    const { container } = render(<VarianceBridge indicators={null} isLoading={false} />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
  });
});

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { evmReportFixture } from '@/mocks/fixtures';

import { ActivityImpactRanking } from './ActivityImpactRanking';

import type { EvmActivityReport } from '@/api/types';

/** Decorative loading placeholders; they carry the class of the shared Skeleton component. */
const SKELETON_SELECTOR = '.skeleton';

const NO_DEVIATION_MESSAGE =
  'Ninguna actividad tiene sobrecosto: no hay desviación de costo que explicar.';

const FIXTURE_ACTIVITIES = evmReportFixture.activities;
/** Diseño and Pruebas, the two activities of the fixture that came out under budget. */
const FAVOURABLE_ACTIVITIES = FIXTURE_ACTIVITIES.filter(
  (activity) => activity.indicators.costVariance > 0,
);

/**
 * jsdom has no layout, so a diverging bar measures nothing. Every assertion targets the list
 * items, which carry the name, the variance, the index and the interpretation as text.
 */
function renderRanking(activities: readonly EvmActivityReport[]) {
  return render(<ActivityImpactRanking activities={activities} isLoading={false} />);
}

/** The worst row of the ranking, which is the first one the list renders. */
function worstRanked(): HTMLElement {
  const [worst] = screen.getAllByRole('listitem');
  if (worst === undefined) {
    throw new Error('The ranking rendered no rows');
  }
  return worst;
}

function rankedTexts(): string[] {
  return screen.getAllByRole('listitem').map((item) => item.textContent ?? '');
}

describe('ActivityImpactRanking with the shared EVM report fixture', () => {
  it('puts the activity that lost the most money first and the most favourable last', () => {
    renderRanking(FIXTURE_ACTIVITIES);

    const [worst, middle, best] = rankedTexts();
    expect(worst).toContain('Desarrollo');
    expect(worst).toContain('-4.000,00');
    expect(middle).toContain('Pruebas');
    expect(middle).toContain('500,00');
    expect(best).toContain('Diseño');
    expect(best).toContain('1.000,00');
  });

  it('gives every row its CPI and the interpretation the report brings', () => {
    renderRanking(FIXTURE_ACTIVITIES);

    const worst = worstRanked();
    expect(within(worst).getByText(/0,8000/)).toBeInTheDocument();
    expect(within(worst).getByText('Sobre presupuesto')).toBeInTheDocument();
  });

  it('names the activity the deviation is concentrated in', () => {
    renderRanking(FIXTURE_ACTIVITIES);

    expect(screen.getByText('El sobrecosto se concentra en Desarrollo.')).toBeInTheDocument();
  });

  it('keeps the whole activity name available on hover, however it is truncated', () => {
    renderRanking(FIXTURE_ACTIVITIES);

    for (const activity of FIXTURE_ACTIVITIES) {
      expect(screen.getByTitle(activity.name)).toHaveTextContent(activity.name);
    }
  });
});

describe('ActivityImpactRanking without any adverse variance', () => {
  it('says there is no cost deviation to explain', () => {
    renderRanking(FAVOURABLE_ACTIVITIES);

    expect(screen.getByText(NO_DEVIATION_MESSAGE)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(FAVOURABLE_ACTIVITIES.length);
  });
});

describe('ActivityImpactRanking with a project without activities', () => {
  it('says so instead of drawing an empty axis', () => {
    renderRanking([]);

    expect(screen.getByText('Sin actividades no hay nada que ordenar.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('ActivityImpactRanking while the report loads', () => {
  it('renders skeletons and no ranking', () => {
    const { container } = render(<ActivityImpactRanking activities={[]} isLoading />);

    expect(container.querySelectorAll(SKELETON_SELECTOR).length).toBeGreaterThan(0);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

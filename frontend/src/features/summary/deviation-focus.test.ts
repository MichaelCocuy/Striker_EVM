import { describe, expect, it } from 'vitest';

import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { DEVIATION_FOCUS_COPY } from './band-copy';
import { readDeviationFocus } from './deviation-focus';

import type { EvmActivityReport } from '@/api/types';

const REPORT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;
const ACTIVITIES = evmReportFixture.activities;

/** Desarrollo is the only activity of the fixture that closes over its own budget. */
const DEVELOPMENT_NAME = 'Desarrollo';
/** 40.000 of a 60.000 budget, as the heat map also reads it. */
const DEVELOPMENT_SHARE = '67%';

function withVarianceAtCompletion(
  activity: EvmActivityReport,
  varianceAtCompletion: number | null,
): EvmActivityReport {
  return { ...activity, indicators: { ...activity.indicators, varianceAtCompletion } };
}

describe('readDeviationFocus', () => {
  it('names the only activity that will close over budget, with its weight', () => {
    const detail = readDeviationFocus(REPORT_INDICATORS, ACTIVITIES);

    expect(detail).toBe(DEVIATION_FOCUS_COPY.ONLY_ADVERSE(DEVELOPMENT_NAME, DEVELOPMENT_SHARE));
    expect(detail).toContain(DEVELOPMENT_NAME);
    expect(detail).toContain(DEVELOPMENT_SHARE);
  });

  it('names the worst one when more than one activity closes over budget', () => {
    const [design, development, testing] = ACTIVITIES;
    if (design === undefined || development === undefined || testing === undefined) {
      throw new Error('The fixture lost one of its three activities');
    }

    const detail = readDeviationFocus(REPORT_INDICATORS, [
      withVarianceAtCompletion(design, -500),
      development,
      testing,
    ]);

    expect(detail).toBe(DEVIATION_FOCUS_COPY.WORST(DEVELOPMENT_NAME, DEVELOPMENT_SHARE));
  });

  it('says the deviation is not concentrated when nothing closes over budget', () => {
    const favourable = ACTIVITIES.map((activity) => withVarianceAtCompletion(activity, 1000));

    expect(readDeviationFocus(REPORT_INDICATORS, favourable)).toBe(DEVIATION_FOCUS_COPY.NONE);
  });

  it('says the forecast is not computable when no activity has one', () => {
    const withoutForecast = ACTIVITIES.map((activity) => withVarianceAtCompletion(activity, null));

    expect(readDeviationFocus(REPORT_INDICATORS, withoutForecast)).toBe(
      DEVIATION_FOCUS_COPY.NOT_COMPUTABLE,
    );
    expect(readDeviationFocus(EMPTY_PROJECT_INDICATORS, [])).toBe(
      DEVIATION_FOCUS_COPY.NOT_COMPUTABLE,
    );
  });
});

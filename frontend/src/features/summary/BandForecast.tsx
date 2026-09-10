import { readSign } from '@/features/evm-report/report-reading';

import { FORECAST_LABEL } from './band-copy';
import { BAND_INK, BAND_TONE_INK } from './band-tokens';
import { BandFigure } from './BandFigure';
import { COMPLETION_VARIANCE_SHORT_READING } from './verdict-copy';
import { readForecastReason } from './verdict-reading';

import type { EvmIndicators } from '@/api/types';

/** The divider that separates the forecast from the two gauges (handoff §3.1, cell 4). */
const CELL_CLASS = 'relative flex flex-col gap-2.5 border-l pl-5';
const LABEL_CLASS = 'eyebrow';
const REASON_CLASS = 'text-caption leading-normal';

interface BandForecastProps {
  indicators: EvmIndicators;
}

/**
 * Fourth cell of the band: what the project will cost at closing and how far that is from
 * its budget. Both figures come from the report; only the sign of the variance is read, to
 * pick its ink and the words that go with it.
 */
export function BandForecast({ indicators }: BandForecastProps) {
  const completion = readSign(indicators.varianceAtCompletion, COMPLETION_VARIANCE_SHORT_READING);
  const reason = readForecastReason(indicators);

  return (
    <div className={CELL_CLASS} style={{ borderColor: BAND_INK.DIVIDER }}>
      <div>
        <p className={LABEL_CLASS} style={{ color: BAND_INK.LABEL }}>
          {FORECAST_LABEL.ESTIMATE_AT_COMPLETION}
        </p>
        <BandFigure value={indicators.estimateAtCompletion} color={BAND_INK.HEADLINE} />
      </div>
      <div>
        <p className={LABEL_CLASS} style={{ color: BAND_INK.LABEL }}>
          {FORECAST_LABEL.VARIANCE_AT_COMPLETION}
        </p>
        <BandFigure
          value={indicators.varianceAtCompletion}
          color={BAND_TONE_INK[completion.tone]}
        />
        <p className={REASON_CLASS} style={{ color: BAND_INK.BODY }}>
          {completion.label}
        </p>
      </div>
      {reason !== null && (
        <p className={REASON_CLASS} style={{ color: BAND_INK.BODY }}>
          {reason}
        </p>
      )}
    </div>
  );
}

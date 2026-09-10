import { formatPercent } from '@/lib/format';

import { PREVIEW_TILE_INDICATORS } from './activity-indicators';
import { PROGRESS_COPY, PROGRESS_TRACK_SIZE } from './activity-progress';
import { ActivityIndicatorTile } from './ActivityFigureTile';
import { ActivityProgressTrack } from './ActivityProgressTrack';
import { draftMeasures, draftProgressReading } from './progress-entry';

import type { ProgressDraft } from './progress-entry';
import type { EvmActivityReport } from '@/api/types';

const COPY = {
  EYEBROW: 'Cómo queda el avance',
  SERVER_RECALCULATES:
    'Los indicadores (EV, CPI, SPI y EAC) los recalcula el servidor al guardar: esta previsualización no los estima.',
  CURRENT_READING: 'Lectura actual del reporte',
} as const;

const TILES_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2.5';

interface ActivityProgressPreviewProps {
  activity: EvmActivityReport;
  draft: ProgressDraft;
}

/**
 * What the panel can show before saving without inventing anything.
 *
 * The handoff offers three ways out of its own preview, whose prototype recomputes EV, CPI,
 * SPI and EAC in the client. This takes the second one: the drafted progress against the plan,
 * which needs no calculation, plus the indicators of the last report, clearly labelled as the
 * current reading and not as a forecast.
 */
export function ActivityProgressPreview({ activity, draft }: ActivityProgressPreviewProps) {
  const measures = draftMeasures(activity, draft);
  const { indicators } = activity;

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 className="eyebrow">{COPY.EYEBROW}</h3>

      <div className="flex flex-col gap-1.5">
        <p className="flex justify-between gap-4 text-caption text-ink-muted">
          <span>{`${PROGRESS_COPY.PLANNED} ${formatPercent(measures.plannedProgressPercent)}`}</span>
          <span>{`${PROGRESS_COPY.ACTUAL} ${formatPercent(measures.actualProgressPercent)}`}</span>
        </p>
        <ActivityProgressTrack
          plannedPercent={measures.plannedProgressPercent}
          actualPercent={measures.actualProgressPercent}
          size={PROGRESS_TRACK_SIZE.DETAIL}
        />
      </div>

      <p className="text-caption text-ink-body">
        {`${draftProgressReading(activity, draft)} ${COPY.SERVER_RECALCULATES}`}
      </p>

      <p className="font-heading text-badge font-bold uppercase tracking-wide text-ink-subtle">
        {COPY.CURRENT_READING}
      </p>
      <div className={TILES_CLASS}>
        {PREVIEW_TILE_INDICATORS.map((indicator) => (
          <ActivityIndicatorTile
            key={indicator.key}
            indicator={indicator}
            indicators={indicators}
          />
        ))}
      </div>
    </section>
  );
}

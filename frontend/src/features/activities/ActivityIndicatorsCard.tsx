import { Card } from '@/components/ui/Card';
import { STATUS_PILL_SIZE } from '@/components/ui/status-pill-sizes';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';

import { ACTIVITY_DETAIL_COPY } from './activity-detail';
import { activityIndexChip } from './activity-index';
import { DETAIL_INDICATORS, INDICATOR_KIND, indicatorValue } from './activity-indicators';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

const ROWS_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-4 gap-y-3';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
interface ActivityIndicatorsCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  indicators: EvmIndicators;
}

/**
 * Right card of the activity detail: every indicator the report brings for the activity, which
 * is what the nine-column table sends the reader here for.
 *
 * The handoff puts the activity's own curve and its list of entries here, but both need the
 * history by cut-off date that neither the database nor the contract has yet; inventing a
 * series would break the rule that the UI only shows what the report calculated. Until that
 * endpoint exists, this card carries the exact figures instead.
 */
export function ActivityIndicatorsCard({ indicators, ...rest }: ActivityIndicatorsCardProps) {
  return (
    <Card
      eyebrow={ACTIVITY_DETAIL_COPY.INDICATORS.EYEBROW}
      title={ACTIVITY_DETAIL_COPY.INDICATORS.TITLE}
      description={ACTIVITY_DETAIL_COPY.INDICATORS.DESCRIPTION}
      {...rest}
    >
      <div className="flex flex-wrap gap-2">
        <StatusPill
          tone={costStatusTone(indicators.costStatus)}
          label={COST_STATUS_LABEL[indicators.costStatus]}
        />
        <StatusPill
          tone={scheduleStatusTone(indicators.scheduleStatus)}
          label={SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
        />
      </div>

      <dl className={ROWS_CLASS}>
        {DETAIL_INDICATORS.map((indicator) => (
          <div key={indicator.key} className="flex flex-col gap-1 border-b border-line pb-2">
            <dt className="text-caption text-ink-muted">
              <abbr title={indicator.description}>{indicator.label}</abbr>
            </dt>
            <dd>
              {indicator.kind === INDICATOR_KIND.INDEX ? (
                <StatusPill
                  {...activityIndexChip(indicator, indicators)}
                  size={STATUS_PILL_SIZE.FIGURE}
                />
              ) : (
                <span className="numeric text-body text-ink">
                  {indicatorValue(indicator, indicators)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {indicators.notes.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-heading text-caption font-semibold text-ink">
            {ACTIVITY_DETAIL_COPY.INDICATORS.NOTES_TITLE}
          </p>
          <ul className="flex flex-col gap-1 text-caption text-ink-muted">
            {indicators.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

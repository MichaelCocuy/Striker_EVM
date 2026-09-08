import { StatusPill } from '@/components/ui/StatusPill';
import { EVM_TONE, EVM_TONE_LABEL, EVM_TONE_TOKENS } from '@/evm/tone';
import { formatIndex, INDEX_DECIMALS } from '@/lib/format';
import { MOTION_DURATION_SECONDS } from '@/motion/constants';
import { useCountUp } from '@/motion/useCountUp';

import { MILLISECONDS_PER_SECOND } from './chart-config';
import {
  GAUGE_ARC,
  GAUGE_ARC_PATH,
  GAUGE_REFERENCE_LABEL,
  GAUGE_VIEWBOX,
  NORMALISED_PATH_LENGTH,
  pointOnArc,
  REFERENCE_FRACTION,
  toArcFraction,
} from './gauge-geometry';
import { useArcSweep } from './useArcSweep';

import type { EvmTone } from '@/evm/tone';

const EMPTY_ARC = 0;
/** The track stays neutral so only the swept arc carries the traffic-light tone. */
const TRACK_TOKEN = '--line-strong';
const COLOR_TRANSITION_MS = MOTION_DURATION_SECONDS.BASE * MILLISECONDS_PER_SECOND;

const VIEWBOX = `0 0 ${String(GAUGE_VIEWBOX.WIDTH)} ${String(GAUGE_VIEWBOX.HEIGHT)}`;

const markInner = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_INNER_RADIUS);
const markOuter = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_OUTER_RADIUS);
const markLabel = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_LABEL_RADIUS);

export interface IndexGaugeProps {
  /** Acronym of the index, e.g. `CPI`. */
  name: string;
  /** One line saying what the index measures. */
  description: string;
  /** The index as the report brings it; `null` when it is not computable. */
  value: number | null;
  /** Traffic-light tone of the status the report brings for this index. */
  tone: EvmTone;
  /** Interpretation the report brings, e.g. `Sobre presupuesto`. */
  statusLabel: string;
}

/**
 * Semicircular gauge for a performance index, with 1.0 marked as the EVM reference.
 *
 * Hand-rolled SVG rather than a Recharts `RadialBarChart`: the reference mark, the clamped
 * 0-2 scale and the "not computable" state are three things the radial chart cannot express
 * without fighting its polar axis, and a two-path arc is less code than that fight.
 */
export function IndexGauge({ name, description, value, tone, statusLabel }: IndexGaugeProps) {
  const isComputable = value !== null;
  /** A `null` index is never drawn as zero: zero would read as a real, terrible index. */
  const gaugeTone = isComputable ? tone : EVM_TONE.NA;
  const gaugeLabel = isComputable ? statusLabel : EVM_TONE_LABEL[EVM_TONE.NA];
  const sweptFraction = useArcSweep(isComputable ? toArcFraction(value) : EMPTY_ARC);
  const displayValue = useCountUp(value, { decimals: INDEX_DECIMALS });
  const { colorToken } = EVM_TONE_TOKENS[gaugeTone];
  const transition = { transitionDuration: `${String(COLOR_TRANSITION_MS)}ms` };

  return (
    <div className="flex flex-col items-center gap-2 rounded-md bg-surface-sunken p-3">
      <h3 className="eyebrow">{name}</h3>
      <div className="relative w-full max-w-64">
        <svg viewBox={VIEWBOX} className="w-full" aria-hidden="true">
          <path
            d={GAUGE_ARC_PATH}
            fill="none"
            strokeWidth={GAUGE_ARC.TRACK_WIDTH}
            strokeLinecap="round"
            className="transition-colors"
            style={{ stroke: `var(${TRACK_TOKEN})` }}
          />
          {sweptFraction > EMPTY_ARC && (
            <path
              d={GAUGE_ARC_PATH}
              fill="none"
              strokeWidth={GAUGE_ARC.TRACK_WIDTH}
              strokeLinecap="round"
              pathLength={NORMALISED_PATH_LENGTH}
              strokeDasharray={`${String(sweptFraction)} ${String(NORMALISED_PATH_LENGTH)}`}
              className="transition-colors"
              style={{ stroke: `var(${colorToken})`, ...transition }}
            />
          )}
          <line
            x1={markInner.x}
            y1={markInner.y}
            x2={markOuter.x}
            y2={markOuter.y}
            strokeWidth={GAUGE_ARC.MARK_WIDTH}
            strokeLinecap="round"
            style={{ stroke: 'var(--ink)' }}
          />
          <text
            x={markLabel.x}
            y={markLabel.y}
            textAnchor="middle"
            fontSize={GAUGE_ARC.MARK_LABEL_FONT_SIZE}
            style={{ fill: 'var(--ink-subtle)' }}
          >
            {GAUGE_REFERENCE_LABEL}
          </text>
        </svg>
        <p className="numeric absolute inset-x-0 bottom-0 text-center text-2xl font-semibold text-ink">
          {formatIndex(displayValue)}
        </p>
      </div>
      <StatusPill tone={gaugeTone} label={gaugeLabel} />
      <p className="text-center text-xs text-ink-muted">{description}</p>
    </div>
  );
}

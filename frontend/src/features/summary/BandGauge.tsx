import { EVM_TONE, EVM_TONE_LABEL } from '@/evm/tone';
import { formatIndex, INDEX_DECIMALS } from '@/lib/format';
import { useCountUp } from '@/motion/useCountUp';
import { useFractionSweep } from '@/motion/useFractionSweep';

import { BAND_LABEL_SEPARATOR } from './band-copy';
import { BAND_INK, BAND_TONE_INK } from './band-tokens';
import {
  EMPTY_ARC,
  GAUGE_ARC,
  GAUGE_ARC_PATH,
  GAUGE_REFERENCE_LABEL,
  GAUGE_VIEWBOX,
  NORMALISED_PATH_LENGTH,
  pointOnArc,
  REFERENCE_FRACTION,
  toArcFraction,
} from './gauge-geometry';

import type { EvmTone } from '@/evm/tone';

const VIEWBOX = `0 0 ${String(GAUGE_VIEWBOX.WIDTH)} ${String(GAUGE_VIEWBOX.HEIGHT)}`;

const markInner = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_INNER_RADIUS);
const markOuter = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_OUTER_RADIUS);
const markLabel = pointOnArc(REFERENCE_FRACTION, GAUGE_ARC.MARK_LABEL_RADIUS);

const CELL_CLASS = 'relative flex flex-col items-center gap-1.5';
const SVG_CLASS = 'w-full max-w-[190px]';

/** The figure inside the arc is Poppins with tabular digits, as every figure of the system. */
const VALUE_STYLE = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: GAUGE_ARC.VALUE_TRACKING,
  fill: BAND_INK.HEADLINE,
} as const;

export interface BandGaugeProps {
  /** Acronym of the index, e.g. `CPI`. */
  name: string;
  /** The index as the report brings it; `null` when it is not computable. */
  value: number | null;
  /** Traffic-light tone of the status the report brings for this index. */
  tone: EvmTone;
  /** Interpretation the report brings, e.g. `Sobre presupuesto`. */
  statusLabel: string;
}

/**
 * Semicircular gauge for a performance index on the navy band, with 1.0 marked as the EVM
 * reference and the value read inside the arc (handoff §3.1).
 *
 * Hand-rolled SVG rather than a Recharts `RadialBarChart`: the reference mark, the clamped
 * 0-2 scale and the "not computable" state are three things the radial chart cannot express
 * without fighting its polar axis.
 *
 * The plot is hidden from assistive technology; `BandIndicatorList` carries the same figures
 * as text.
 */
export function BandGauge({ name, value, tone, statusLabel }: BandGaugeProps) {
  const isComputable = value !== null;
  /** A `null` index is never drawn as zero: zero would read as a real, terrible index. */
  const gaugeTone = isComputable ? tone : EVM_TONE.NA;
  const gaugeLabel = isComputable ? statusLabel : EVM_TONE_LABEL[EVM_TONE.NA];
  const sweptFraction = useFractionSweep(isComputable ? toArcFraction(value) : EMPTY_ARC);
  const displayValue = useCountUp(value, { decimals: INDEX_DECIMALS });

  return (
    <div className={CELL_CLASS}>
      <svg viewBox={VIEWBOX} className={SVG_CLASS} aria-hidden="true">
        <path
          d={GAUGE_ARC_PATH}
          fill="none"
          stroke={BAND_INK.GAUGE_TRACK}
          strokeWidth={GAUGE_ARC.TRACK_WIDTH}
          strokeLinecap="round"
        />
        {sweptFraction > EMPTY_ARC && (
          <path
            d={GAUGE_ARC_PATH}
            fill="none"
            stroke={BAND_TONE_INK[gaugeTone]}
            strokeWidth={GAUGE_ARC.TRACK_WIDTH}
            strokeLinecap="round"
            pathLength={NORMALISED_PATH_LENGTH}
            strokeDasharray={`${String(sweptFraction)} ${String(NORMALISED_PATH_LENGTH)}`}
          />
        )}
        <line
          x1={markInner.x}
          y1={markInner.y}
          x2={markOuter.x}
          y2={markOuter.y}
          stroke={BAND_INK.GAUGE_MARK}
          strokeWidth={GAUGE_ARC.MARK_WIDTH}
          strokeLinecap="round"
        />
        <text
          x={markLabel.x}
          y={markLabel.y}
          textAnchor="middle"
          fontSize={GAUGE_ARC.MARK_LABEL_FONT_SIZE}
          fill={BAND_INK.GAUGE_MARK_LABEL}
        >
          {GAUGE_REFERENCE_LABEL}
        </text>
        <text
          x={GAUGE_ARC.CENTER_X}
          y={GAUGE_ARC.VALUE_Y}
          textAnchor="middle"
          fontSize={GAUGE_ARC.VALUE_FONT_SIZE}
          style={VALUE_STYLE}
        >
          {formatIndex(displayValue)}
        </text>
      </svg>
      <p className="eyebrow text-center" style={{ color: BAND_INK.OVERLINE }}>
        {`${name}${BAND_LABEL_SEPARATOR}${gaugeLabel}`}
      </p>
    </div>
  );
}

import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EVM_TONE, EVM_TONE_TOKENS } from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { formatNumber } from '@/lib/format';
import { useTokenColors } from '@/theme/useTokenColors';

import { ActivityBubble } from './ActivityBubble';
import { ActivityQuadrantTable } from './ActivityQuadrantTable';
import { CHART_COLOR_TOKENS, CHART_FURNITURE_TOKEN } from './chart-config';
import {
  INDEX_REFERENCE,
  PLOT_WIDTH,
  QUADRANT,
  QUADRANT_BANDS,
  QUADRANT_VIEWBOX,
  QUADRANT_Y_TITLE_TRANSFORM,
} from './quadrant-geometry';
import { toQuadrantModel } from './quadrant-points';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ActivityQuadrantProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Activities as the report returns them. */
  activities: readonly EvmActivityReport[];
  isLoading: boolean;
  className?: string;
}

/** The reference label reads as a scale mark ("1,0"), not as an indicator value. */
const REFERENCE_LABEL_DECIMALS = 1;
const REFERENCE_LABEL = formatNumber(INDEX_REFERENCE, REFERENCE_LABEL_DECIMALS);
const NAME_SEPARATOR = ', ';

const COPY = {
  EYEBROW: 'Cuadrante por actividad',
  TITLE: 'Dónde está el problema',
  DESCRIPTION:
    'Cada burbuja es una actividad; el diámetro es su presupuesto. Arriba a la derecha es barata y a tiempo; abajo a la izquierda, cara y atrasada.',
  PLOT_LABEL:
    'Dispersión de CPI contra SPI por actividad; el diámetro de cada burbuja es su presupuesto.',
  X_TITLE: 'SPI · cronograma',
  Y_TITLE: 'CPI · costo',
  BANDS_NOTE:
    'La banda verde es CPI por encima de 1,0 y la roja por debajo. El monto dentro de la burbuja es el presupuesto de la actividad.',
  OFF_SCALE_NOTE: (names: string) =>
    `Con el trazo punteado: ${names}. Sus índices caen fuera de la escala, así que la burbuja se dibuja en el borde y su posición es aproximada.`,
  NOT_PLOTTED_NOTE: (names: string) =>
    `No se dibujan: ${names}. El reporte no pudo calcular su CPI o su SPI, y un índice no calculable no se pinta como cero.`,
  EMPTY: 'Agrega una actividad para ver el cuadrante.',
} as const;

const SKELETON_CLASS = 'h-72 w-full';
const PLOT_CLASS = 'min-w-0 overflow-x-auto';
const SVG_CLASS = 'h-auto w-full min-w-[320px]';
const NOTE_CLASS = 'text-caption leading-normal text-ink-subtle';

const GOOD_TONE_TOKENS = EVM_TONE_TOKENS[EVM_TONE.GOOD];
const BAD_TONE_TOKENS = EVM_TONE_TOKENS[EVM_TONE.BAD];

/**
 * Per-activity CPI × SPI quadrant (handoff §3.5): where the problem is, in one picture. It
 * reuses the scatter language of the portfolio quadrant one level down — same bands, same
 * dashed references, same halo, same dashed outline and caption for an off-scale point.
 *
 * Contract: both indices and the budget come from the report; an activity without a
 * computable index is left out of the plot and named in a note under it.
 */
export function ActivityQuadrant({
  activities,
  isLoading,
  className = '',
  ...rest
}: ActivityQuadrantProps) {
  const colors = useTokenColors(CHART_COLOR_TOKENS);
  /** Memoized so a re-render with the same report does not rebuild the geometry. */
  const model = useMemo(() => toQuadrantModel(activities), [activities]);

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading ? (
        <Skeleton className={SKELETON_CLASS} />
      ) : activities.length === 0 ? (
        <p className="text-small text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={PLOT_CLASS}>
            <svg
              viewBox={QUADRANT_VIEWBOX}
              role="img"
              aria-label={COPY.PLOT_LABEL}
              className={SVG_CLASS}
            >
              <rect
                x={QUADRANT.PLOT_LEFT}
                y={QUADRANT_BANDS.GOOD.y}
                width={PLOT_WIDTH}
                height={QUADRANT_BANDS.GOOD.height}
                fill={colors[GOOD_TONE_TOKENS.softColorToken]}
                opacity={QUADRANT_BANDS.GOOD.opacity}
              />
              <rect
                x={QUADRANT.PLOT_LEFT}
                y={QUADRANT_BANDS.BAD.y}
                width={PLOT_WIDTH}
                height={QUADRANT_BANDS.BAD.height}
                fill={colors[BAD_TONE_TOKENS.softColorToken]}
                opacity={QUADRANT_BANDS.BAD.opacity}
              />
              <line
                x1={QUADRANT.PLOT_LEFT}
                y1={QUADRANT.PLOT_BOTTOM}
                x2={QUADRANT.PLOT_RIGHT}
                y2={QUADRANT.PLOT_BOTTOM}
                stroke={colors[CHART_FURNITURE_TOKEN.AXIS]}
              />
              <line
                x1={QUADRANT.PLOT_LEFT}
                y1={QUADRANT.PLOT_TOP}
                x2={QUADRANT.PLOT_LEFT}
                y2={QUADRANT.PLOT_BOTTOM}
                stroke={colors[CHART_FURNITURE_TOKEN.AXIS]}
              />
              <line
                x1={QUADRANT.PLOT_LEFT}
                y1={QUADRANT.REFERENCE_Y}
                x2={QUADRANT.PLOT_RIGHT}
                y2={QUADRANT.REFERENCE_Y}
                stroke={colors[CHART_FURNITURE_TOKEN.NAME_INK]}
                strokeDasharray={QUADRANT.REFERENCE_DASH}
              />
              <line
                x1={QUADRANT.REFERENCE_X}
                y1={QUADRANT.PLOT_TOP}
                x2={QUADRANT.REFERENCE_X}
                y2={QUADRANT.PLOT_BOTTOM}
                stroke={colors[CHART_FURNITURE_TOKEN.NAME_INK]}
                strokeDasharray={QUADRANT.REFERENCE_DASH}
              />
              <text
                x={QUADRANT.SPI_LABEL_X}
                y={QUADRANT.SPI_LABEL_Y}
                fontSize={QUADRANT.LABEL_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.LABEL_INK]}
              >
                {`${INDICATORS.SCHEDULE_PERFORMANCE_INDEX.acronym} ${REFERENCE_LABEL}`}
              </text>
              <text
                x={QUADRANT.CPI_LABEL_X}
                y={QUADRANT.CPI_LABEL_Y}
                fontSize={QUADRANT.LABEL_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.LABEL_INK]}
              >
                {`${INDICATORS.COST_PERFORMANCE_INDEX.acronym} ${REFERENCE_LABEL}`}
              </text>
              <text
                x={QUADRANT.X_TITLE_X}
                y={QUADRANT.X_TITLE_Y}
                textAnchor="middle"
                fontSize={QUADRANT.TITLE_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.GLOSS_INK]}
                className="font-heading font-semibold"
              >
                {COPY.X_TITLE}
              </text>
              <text
                x={QUADRANT.Y_TITLE_X}
                y={QUADRANT.Y_TITLE_Y}
                textAnchor="middle"
                fontSize={QUADRANT.TITLE_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.GLOSS_INK]}
                transform={QUADRANT_Y_TITLE_TRANSFORM}
                className="font-heading font-semibold"
              >
                {COPY.Y_TITLE}
              </text>
              {model.points.map((point) => (
                <ActivityBubble
                  key={point.id}
                  point={point}
                  color={colors[EVM_TONE_TOKENS[point.tone].colorToken] ?? ''}
                  softColor={colors[EVM_TONE_TOKENS[point.tone].softColorToken] ?? ''}
                  haloColor={colors[CHART_FURNITURE_TOKEN.HALO] ?? ''}
                />
              ))}
            </svg>
          </div>
          <ActivityQuadrantTable points={model.points} />
          <p className={NOTE_CLASS}>{COPY.BANDS_NOTE}</p>
          {model.offScale.length > 0 && (
            <p className={NOTE_CLASS}>{COPY.OFF_SCALE_NOTE(model.offScale.join(NAME_SEPARATOR))}</p>
          )}
          {model.notPlotted.length > 0 && (
            <p className={NOTE_CLASS}>
              {COPY.NOT_PLOTTED_NOTE(model.notPlotted.join(NAME_SEPARATOR))}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

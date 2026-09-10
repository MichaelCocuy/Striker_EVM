import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { useFractionSweep } from '@/motion/useFractionSweep';
import { useTokenColors } from '@/theme/useTokenColors';

import { BaseValuesStrip } from './BaseValuesStrip';
import { BRIDGE, BRIDGE_VIEWBOX, bridgeSweptY } from './bridge-geometry';
import { bridgeScale, toBridgeModel } from './bridge-rows';
import { BridgeValuesTable } from './BridgeValuesTable';
import { CHART_COLOR_TOKENS, CHART_FURNITURE_TOKEN } from './chart-config';
import { EMPTY_SCALE } from './nice-scale';

import type { EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface VarianceBridgeProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Consolidated indicators of the project; `null` while the report is loading. */
  indicators: EvmIndicators | null;
  isLoading: boolean;
  className?: string;
}

const COPY = {
  EYEBROW: 'Puente de varianzas',
  TITLE: 'De lo planificado a lo gastado',
  DESCRIPTION:
    'Dos saltos separan el plan del gasto: lo que no se hizo (SV) y lo que se pagó de más por lo que sí se hizo (CV).',
  PLOT_LABEL:
    'Puente de varianzas: de PV a AC pasando por el salto del cronograma (SV), el valor ganado (EV) y el salto de costo (CV).',
  EMPTY: 'Agrega una actividad para ver el puente.',
} as const;

/** The bridge grows out of its baseline once, as a single gesture. */
const FULL_SWEEP = 1;

/** One placeholder line per column plus the strip of base values under the plot. */
const SKELETON_LINES = 6;

const PLOT_CLASS = 'min-w-0 overflow-x-auto';
const SVG_CLASS = 'h-auto w-full min-w-[420px]';

/**
 * Variance bridge (handoff §3.3): a five-column waterfall that decomposes the distance
 * between PV and AC into the two jumps the report already measured.
 *
 * Contract: `scheduleVariance` and `costVariance` come from the report; only their sign is
 * read, to choose the ink and the word under each jump. Under the plot, the four base
 * figures of the report to the cent.
 */
export function VarianceBridge({
  indicators,
  isLoading,
  className = '',
  ...rest
}: VarianceBridgeProps) {
  const colors = useTokenColors(CHART_COLOR_TOKENS);
  const sweep = useFractionSweep(FULL_SWEEP);
  /** Memoized so a re-render with the same report does not rebuild the geometry. */
  const model = useMemo(
    () => (indicators === null ? null : toBridgeModel(indicators)),
    [indicators],
  );
  const scale = indicators === null ? EMPTY_SCALE : bridgeScale(indicators);

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading || indicators === null || model === null ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : scale <= EMPTY_SCALE ? (
        <p className="text-small text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className={PLOT_CLASS}>
            <svg
              viewBox={BRIDGE_VIEWBOX}
              role="img"
              aria-label={COPY.PLOT_LABEL}
              className={SVG_CLASS}
            >
              <line
                x1={BRIDGE.BASELINE_X1}
                y1={BRIDGE.BASELINE_Y}
                x2={BRIDGE.BASELINE_X2}
                y2={BRIDGE.BASELINE_Y}
                stroke={colors[CHART_FURNITURE_TOKEN.AXIS]}
              />
              {model.connectors.map((connector) => (
                <line
                  key={connector.x1}
                  x1={connector.x1}
                  y1={bridgeSweptY(connector.y, sweep)}
                  x2={connector.x2}
                  y2={bridgeSweptY(connector.y, sweep)}
                  stroke={colors[CHART_FURNITURE_TOKEN.CONNECTOR]}
                  strokeDasharray={BRIDGE.CONNECTOR_DASH}
                />
              ))}
              {model.columns.map((column) => (
                <g key={column.meta.acronym}>
                  <rect
                    x={column.x}
                    y={bridgeSweptY(column.y, sweep)}
                    width={BRIDGE.BAR_WIDTH}
                    height={column.height * sweep}
                    rx={BRIDGE.BAR_RADIUS}
                    fill={colors[column.fillToken]}
                  />
                  <text
                    x={column.centerX}
                    y={column.y - BRIDGE.FIGURE_OFFSET_Y}
                    textAnchor="middle"
                    fontSize={BRIDGE.FIGURE_FONT_SIZE}
                    fill={colors[column.inkToken]}
                    className="numeric"
                  >
                    {column.figure}
                  </text>
                  <text
                    x={column.centerX}
                    y={BRIDGE.ACRONYM_Y}
                    textAnchor="middle"
                    fontSize={BRIDGE.ACRONYM_FONT_SIZE}
                    fill={colors[CHART_FURNITURE_TOKEN.GLOSS_INK]}
                    className="font-heading font-semibold"
                  >
                    {column.meta.acronym}
                  </text>
                  <text
                    x={column.centerX}
                    y={BRIDGE.GLOSS_Y}
                    textAnchor="middle"
                    fontSize={BRIDGE.GLOSS_FONT_SIZE}
                    fill={colors[CHART_FURNITURE_TOKEN.LABEL_INK]}
                  >
                    {column.gloss}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <BaseValuesStrip indicators={indicators} />
          <BridgeValuesTable columns={model.columns} />
        </div>
      )}
    </Card>
  );
}

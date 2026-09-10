import { Card } from '@/components/ui/Card';
import { useTokenColors } from '@/theme/useTokenColors';

import { PORTFOLIO_COPY } from './portfolio-copy';
import {
  isPlottable,
  QUADRANT_ANCHOR,
  QUADRANT_BAND_OPACITY,
  QUADRANT_COLOR_TOKENS,
  QUADRANT_LINE_WIDTH,
  QUADRANT_ORIGIN,
  QUADRANT_PLOT,
  QUADRANT_REFERENCE_DASH,
  QUADRANT_TEXT,
  QUADRANT_TOKEN,
  QUADRANT_VIEWBOX,
  QUADRANT_Y_TITLE_TRANSFORM,
  toQuadrantBubbles,
} from './portfolio-quadrant';
import { QuadrantBubble } from './QuadrantBubble';
import { QuadrantValuesTable } from './QuadrantValuesTable';

import type { PortfolioItem } from './portfolio-items';

/**
 * CPI against SPI, one bubble per project. Hand-rolled SVG rather than a Recharts
 * `ScatterChart`: the handoff fixes every coordinate of this plot — the off-centre reference
 * cross, the two bands, the halo of a point that lands on a reference line and the dashed
 * outline of an off-scale one — and a scatter chart cannot express those without fighting its
 * own axes.
 *
 * This is the scatter language the project dashboard reuses per activity.
 */

const VIEWBOX = `0 0 ${String(QUADRANT_VIEWBOX.WIDTH)} ${String(QUADRANT_VIEWBOX.HEIGHT)}`;
const PLOT_WIDTH = QUADRANT_PLOT.RIGHT - QUADRANT_PLOT.LEFT;
const GOOD_BAND_HEIGHT = QUADRANT_ORIGIN.Y - QUADRANT_PLOT.TOP;
const BAD_BAND_HEIGHT = QUADRANT_PLOT.BOTTOM - QUADRANT_ORIGIN.Y;

const NOTE_CLASSES = 'text-caption leading-normal text-ink-subtle';
const ITEM_SEPARATOR = ', ';
const NUMBER_SEPARATOR = ' · ';

interface NamedItem {
  number: string;
  name: string;
}

/** `06 · App móvil de campo`, joined for a sentence. */
function describeItems(items: readonly NamedItem[]): string {
  return items.map((item) => `${item.number}${NUMBER_SEPARATOR}${item.name}`).join(ITEM_SEPARATOR);
}

interface PortfolioQuadrantProps {
  items: readonly PortfolioItem[];
}

export function PortfolioQuadrant({ items }: PortfolioQuadrantProps) {
  const colors = useTokenColors(QUADRANT_COLOR_TOKENS);
  const bubbles = toQuadrantBubbles(items);
  const offScale = bubbles.filter((bubble) => bubble.isOffScale);
  const notPlotted = items
    .filter((item) => !isPlottable(item))
    .map((item) => ({ number: item.number, name: item.entry.project.name }));
  const { QUADRANT } = PORTFOLIO_COPY;

  return (
    <Card
      eyebrow={QUADRANT.OVERLINE}
      title={QUADRANT.TITLE}
      description={QUADRANT.DESCRIPTION}
      className="min-w-0"
    >
      <svg viewBox={VIEWBOX} role="img" aria-label={QUADRANT.CHART_LABEL} className="h-auto w-full">
        <rect
          x={QUADRANT_PLOT.LEFT}
          y={QUADRANT_PLOT.TOP}
          width={PLOT_WIDTH}
          height={GOOD_BAND_HEIGHT}
          fill={colors[QUADRANT_TOKEN.BAND_GOOD]}
          opacity={QUADRANT_BAND_OPACITY.GOOD}
        />
        <rect
          x={QUADRANT_PLOT.LEFT}
          y={QUADRANT_ORIGIN.Y}
          width={PLOT_WIDTH}
          height={BAD_BAND_HEIGHT}
          fill={colors[QUADRANT_TOKEN.BAND_BAD]}
          opacity={QUADRANT_BAND_OPACITY.BAD}
        />

        <line
          x1={QUADRANT_PLOT.LEFT}
          y1={QUADRANT_PLOT.TOP}
          x2={QUADRANT_PLOT.LEFT}
          y2={QUADRANT_PLOT.BOTTOM}
          stroke={colors[QUADRANT_TOKEN.AXIS]}
          strokeWidth={QUADRANT_LINE_WIDTH}
        />
        <line
          x1={QUADRANT_PLOT.LEFT}
          y1={QUADRANT_PLOT.BOTTOM}
          x2={QUADRANT_PLOT.RIGHT}
          y2={QUADRANT_PLOT.BOTTOM}
          stroke={colors[QUADRANT_TOKEN.AXIS]}
          strokeWidth={QUADRANT_LINE_WIDTH}
        />

        <line
          x1={QUADRANT_PLOT.LEFT}
          y1={QUADRANT_ORIGIN.Y}
          x2={QUADRANT_PLOT.RIGHT}
          y2={QUADRANT_ORIGIN.Y}
          stroke={colors[QUADRANT_TOKEN.REFERENCE]}
          strokeWidth={QUADRANT_LINE_WIDTH}
          strokeDasharray={QUADRANT_REFERENCE_DASH}
        />
        <line
          x1={QUADRANT_ORIGIN.X}
          y1={QUADRANT_PLOT.TOP}
          x2={QUADRANT_ORIGIN.X}
          y2={QUADRANT_PLOT.BOTTOM}
          stroke={colors[QUADRANT_TOKEN.REFERENCE]}
          strokeWidth={QUADRANT_LINE_WIDTH}
          strokeDasharray={QUADRANT_REFERENCE_DASH}
        />

        <text
          x={QUADRANT_ANCHOR.CHEAP.x}
          y={QUADRANT_ANCHOR.CHEAP.y}
          textAnchor="end"
          fontSize={QUADRANT_TEXT.CORNER_FONT_SIZE}
          letterSpacing={QUADRANT_TEXT.CORNER_LETTER_SPACING}
          fill={colors[QUADRANT_TOKEN.CHEAP]}
          className="font-heading font-bold"
        >
          {QUADRANT.CHEAP}
        </text>
        <text
          x={QUADRANT_ANCHOR.EXPENSIVE.x}
          y={QUADRANT_ANCHOR.EXPENSIVE.y}
          textAnchor="end"
          fontSize={QUADRANT_TEXT.CORNER_FONT_SIZE}
          letterSpacing={QUADRANT_TEXT.CORNER_LETTER_SPACING}
          fill={colors[QUADRANT_TOKEN.EXPENSIVE]}
          className="font-heading font-bold"
        >
          {QUADRANT.EXPENSIVE}
        </text>
        <text
          x={QUADRANT_ANCHOR.SPI_REFERENCE.x}
          y={QUADRANT_ANCHOR.SPI_REFERENCE.y}
          fontSize={QUADRANT_TEXT.REFERENCE_FONT_SIZE}
          fill={colors[QUADRANT_TOKEN.AXIS_LABEL]}
        >
          {QUADRANT.SPI_REFERENCE}
        </text>
        <text
          x={QUADRANT_ANCHOR.CPI_REFERENCE.x}
          y={QUADRANT_ANCHOR.CPI_REFERENCE.y}
          fontSize={QUADRANT_TEXT.REFERENCE_FONT_SIZE}
          fill={colors[QUADRANT_TOKEN.AXIS_LABEL]}
        >
          {QUADRANT.CPI_REFERENCE}
        </text>
        <text
          x={QUADRANT_ANCHOR.X_AXIS_TITLE.x}
          y={QUADRANT_ANCHOR.X_AXIS_TITLE.y}
          textAnchor="middle"
          fontSize={QUADRANT_TEXT.AXIS_TITLE_FONT_SIZE}
          fill={colors[QUADRANT_TOKEN.AXIS_TITLE]}
          className="font-heading font-semibold"
        >
          {QUADRANT.X_AXIS_TITLE}
        </text>
        <text
          x={QUADRANT_ANCHOR.Y_AXIS_TITLE.x}
          y={QUADRANT_ANCHOR.Y_AXIS_TITLE.y}
          textAnchor="middle"
          fontSize={QUADRANT_TEXT.AXIS_TITLE_FONT_SIZE}
          fill={colors[QUADRANT_TOKEN.AXIS_TITLE]}
          transform={QUADRANT_Y_TITLE_TRANSFORM}
          className="font-heading font-semibold"
        >
          {QUADRANT.Y_AXIS_TITLE}
        </text>

        {bubbles.map((bubble) => (
          <QuadrantBubble
            key={bubble.key}
            bubble={bubble}
            color={colors[bubble.colorToken] ?? ''}
            haloColor={colors[QUADRANT_TOKEN.HALO] ?? ''}
          />
        ))}
      </svg>

      <QuadrantValuesTable items={items} />

      <p className={NOTE_CLASSES}>{QUADRANT.BANDS_NOTE}</p>
      {offScale.length > 0 && (
        <p className={NOTE_CLASSES}>
          {`${QUADRANT.OFF_SCALE_NOTE_PREFIX}${describeItems(offScale)}${QUADRANT.OFF_SCALE_NOTE_SUFFIX}`}
        </p>
      )}
      {notPlotted.length > 0 && (
        <p className={NOTE_CLASSES}>
          {`${QUADRANT.NOT_PLOTTED_NOTE_PREFIX} ${describeItems(notPlotted)}.`}
        </p>
      )}
    </Card>
  );
}

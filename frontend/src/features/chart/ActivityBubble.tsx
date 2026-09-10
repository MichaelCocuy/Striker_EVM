import { QUADRANT } from './quadrant-geometry';

import type { QuadrantPoint } from './quadrant-points';

/**
 * One activity as a bubble: soft fill, full-strength outline, its budget inside and its name
 * above, both in the ink of its traffic light. Same shape as `QuadrantBubble` of the
 * portfolio quadrant, with the name outside because there are only a handful of points.
 */

interface ActivityBubbleProps {
  point: QuadrantPoint;
  /** Resolved ink of the point's tone (SVG attributes cannot take a `var(--token)`). */
  color: string;
  /** Resolved soft background of the same tone. */
  softColor: string;
  /** Resolved card colour, painted behind a bubble that sits on a reference line. */
  haloColor: string;
}

export function ActivityBubble({ point, color, softColor, haloColor }: ActivityBubbleProps) {
  const { centerX, centerY, radius } = point;

  return (
    <g>
      {point.hasHalo && <circle cx={centerX} cy={centerY} r={radius} fill={haloColor} />}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={softColor}
        stroke={color}
        strokeWidth={QUADRANT.BUBBLE_STROKE_WIDTH}
        {...(point.isOffScale ? { strokeDasharray: QUADRANT.OFF_SCALE_DASH } : {})}
      />
      <text
        x={centerX}
        y={centerY + QUADRANT.AMOUNT_OFFSET_Y}
        textAnchor="middle"
        fontSize={point.amountFontSize}
        fill={color}
        className="numeric"
      >
        {point.amount}
      </text>
      <text
        x={centerX}
        y={point.nameY}
        textAnchor="middle"
        fontSize={QUADRANT.NAME_FONT_SIZE}
        fill={color}
        className="font-heading font-bold"
      >
        {point.label}
      </text>
    </g>
  );
}

import { QUADRANT_BUBBLE } from './portfolio-quadrant';

import type { QuadrantBubbleModel } from './portfolio-quadrant';

/**
 * One project as a bubble: fill at a fifth of its ink, full-strength outline, and its number
 * inside so the row of the list and the point can be read together.
 */

interface QuadrantBubbleProps {
  bubble: QuadrantBubbleModel;
  /** Resolved ink of the bubble's tone (SVG attributes cannot take a `var(--token)`). */
  color: string;
  /** Resolved card colour, painted behind a bubble that sits on a reference line. */
  haloColor: string;
}

export function QuadrantBubble({ bubble, color, haloColor }: QuadrantBubbleProps) {
  const { centerX, centerY, radius } = bubble;

  return (
    <g>
      {bubble.needsHalo && <circle cx={centerX} cy={centerY} r={radius} fill={haloColor} />}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={color}
        fillOpacity={QUADRANT_BUBBLE.FILL_OPACITY}
        stroke={color}
        strokeWidth={QUADRANT_BUBBLE.STROKE_WIDTH}
        {...(bubble.isOffScale ? { strokeDasharray: QUADRANT_BUBBLE.OFF_SCALE_DASH } : {})}
      />
      <text
        x={centerX}
        y={centerY + QUADRANT_BUBBLE.LABEL_BASELINE_OFFSET}
        textAnchor="middle"
        fontSize={QUADRANT_BUBBLE.LABEL_FONT_SIZE}
        fill={color}
        className="font-heading font-bold"
      >
        {bubble.number}
      </text>
    </g>
  );
}

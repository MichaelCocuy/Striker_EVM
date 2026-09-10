/**
 * Geometry of the Lucide icons of these views, as the handoff declares it: line only,
 * `currentColor`, stroke 1.6 for light UI and 1.8 where the icon carries emphasis
 * (the alert of the detail, the back affordance, the close button of the panel).
 */
export const ICON_SIZE = {
  /** Inline affordance inside a table row or a chip. */
  ROW: 16,
  /** Icon that sits next to running text. */
  CONTENT: 18,
  /** Close button of the side panel. */
  CLOSE: 20,
} as const;

export const ICON_STROKE = {
  UI: 1.6,
  EMPHASIS: 1.8,
} as const;

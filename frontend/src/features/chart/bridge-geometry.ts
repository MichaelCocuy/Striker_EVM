import { EMPTY_SCALE } from './nice-scale';

/**
 * Geometry of the variance bridge, in viewBox units (handoff §3.3).
 *
 * The five columns are fixed; only the heights follow the money. With the shared report
 * fixture (PV 32.000 as the tallest bar) 1.000 is worth 4,6875px, which reproduces the
 * handoff bar for bar: PV 150px, SV 14,1px, EV 135,9px, CV 11,7px and AC 147,6px.
 */
export const BRIDGE = {
  VIEWBOX_WIDTH: 600,
  VIEWBOX_HEIGHT: 250,
  BASELINE_Y: 200,
  BASELINE_X1: 30,
  BASELINE_X2: 580,
  /** Height of the tallest bar; it sets the money scale of the whole plot. */
  MAX_BAR_HEIGHT: 150,
  BAR_WIDTH: 72,
  BAR_RADIUS: 2,
  FIRST_COLUMN_X: 46,
  COLUMN_PITCH: 118,
  /** The figure is written this far above the top of its bar. */
  FIGURE_OFFSET_Y: 8,
  FIGURE_FONT_SIZE: 12,
  ACRONYM_Y: 220,
  ACRONYM_FONT_SIZE: 11,
  GLOSS_Y: 236,
  GLOSS_FONT_SIZE: 10.5,
  CONNECTOR_DASH: '3 3',
} as const;

/** A centre is half a width along. */
const HALF = 2;

export const BRIDGE_VIEWBOX = `0 0 ${String(BRIDGE.VIEWBOX_WIDTH)} ${String(BRIDGE.VIEWBOX_HEIGHT)}`;

export function bridgeColumnX(index: number): number {
  return BRIDGE.FIRST_COLUMN_X + BRIDGE.COLUMN_PITCH * index;
}

/** Centre of a column: the figure, the acronym and the gloss are anchored there. */
export function bridgeColumnCenter(index: number): number {
  return bridgeColumnX(index) + BRIDGE.BAR_WIDTH / HALF;
}

/** Right edge of a column, where the dashed connector to the next one starts. */
export function bridgeColumnRight(index: number): number {
  return bridgeColumnX(index) + BRIDGE.BAR_WIDTH;
}

/** Height in viewBox units of an amount of money, on the scale of the tallest bar. */
export function bridgeHeight(value: number, scale: number): number {
  if (scale <= EMPTY_SCALE) {
    return EMPTY_SCALE;
  }
  return (Math.abs(value) / scale) * BRIDGE.MAX_BAR_HEIGHT;
}

/** Top of an anchor bar, which always grows from the baseline. */
export function bridgeAnchorTop(value: number, scale: number): number {
  return BRIDGE.BASELINE_Y - bridgeHeight(value, scale);
}

/**
 * The same y once the entry sweep has run `sweep` of its way. The whole bridge grows out of
 * the baseline in one gesture, so anchors and floating jumps stay joined at every frame.
 */
export function bridgeSweptY(y: number, sweep: number): number {
  return BRIDGE.BASELINE_Y - (BRIDGE.BASELINE_Y - y) * sweep;
}

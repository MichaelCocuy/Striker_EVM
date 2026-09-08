/** How prominent a figure is: the headline indices are read first, the rest support them. */
export const FIGURE_SIZE = {
  HEADLINE: 'HEADLINE',
  COMPACT: 'COMPACT',
} as const;

export type FigureSize = (typeof FIGURE_SIZE)[keyof typeof FIGURE_SIZE];

export const FIGURE_SIZE_CLASS: Record<FigureSize, string> = {
  [FIGURE_SIZE.HEADLINE]: 'text-kpi font-semibold',
  [FIGURE_SIZE.COMPACT]: 'text-2xl font-semibold',
};

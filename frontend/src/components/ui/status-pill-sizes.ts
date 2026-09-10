export const STATUS_PILL_SIZE = {
  /** The chip of a card: 12px with the tone's dot beside the label. */
  MD: 'md',
  /**
   * The dense chip of a list row: Poppins 600 at 10,5px with 3/9px of padding, and no dot —
   * at that measure the label alone carries the tone, which is what the row has space for.
   */
  SM: 'sm',
  /**
   * The chip that holds a figure instead of a status in words: Poppins 700 at 12px with
   * tabular digits, so a column of them lines up. It needs a `description` to say what the
   * traffic light means, because a number does not say it.
   */
  FIGURE: 'figure',
  /** The same figure chip at 10px, for a card where the name travels with the number. */
  FIGURE_SM: 'figureSm',
} as const;

export type StatusPillSize = (typeof STATUS_PILL_SIZE)[keyof typeof STATUS_PILL_SIZE];

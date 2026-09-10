export const STATUS_PILL_SIZE = {
  /** The chip of a card: 12px with the tone's dot beside the label. */
  MD: 'md',
  /**
   * The dense chip of a list row: Poppins 600 at 10,5px with 3/9px of padding, and no dot —
   * at that measure the label alone carries the tone, which is what the row has space for.
   */
  SM: 'sm',
} as const;

export type StatusPillSize = (typeof STATUS_PILL_SIZE)[keyof typeof STATUS_PILL_SIZE];

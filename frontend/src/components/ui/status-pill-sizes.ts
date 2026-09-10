export const STATUS_PILL_SIZE = {
  MD: 'md',
  /** For dense rows, where the pill shares a cell with figures. */
  SM: 'sm',
} as const;

export type StatusPillSize = (typeof STATUS_PILL_SIZE)[keyof typeof STATUS_PILL_SIZE];

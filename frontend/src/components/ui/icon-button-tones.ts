export const ICON_BUTTON_TONE = {
  /** Quiet until hovered, navy on hover: the controls of the topbar. */
  NEUTRAL: 'neutral',
  /** Same square over the navy sidebar or a navy band. */
  ON_NAVY: 'onNavy',
  /** A destructive action in a row, where a filled danger button would shout. */
  DANGER: 'danger',
} as const;

export type IconButtonTone = (typeof ICON_BUTTON_TONE)[keyof typeof ICON_BUTTON_TONE];

export const ICON_BUTTON_SIZE = {
  /** 36px: the topbar. */
  MD: 'md',
  /** 32px: the actions of a dense list row. */
  SM: 'sm',
} as const;

export type IconButtonSize = (typeof ICON_BUTTON_SIZE)[keyof typeof ICON_BUTTON_SIZE];

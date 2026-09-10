export const ICON_BUTTON_TONE = {
  /** 36×36 square of the topbar: quiet until hovered, navy on hover. */
  QUIET: 'quiet',
  /** Same square over the navy sidebar or a navy band. */
  ON_NAVY: 'onNavy',
} as const;

export type IconButtonTone = (typeof ICON_BUTTON_TONE)[keyof typeof ICON_BUTTON_TONE];

/** Tones of `IconButton`, in their own module so the component file only exports components. */
export const ICON_BUTTON_TONE = {
  NEUTRAL: 'neutral',
  DANGER: 'danger',
} as const;

export type IconButtonTone = (typeof ICON_BUTTON_TONE)[keyof typeof ICON_BUTTON_TONE];

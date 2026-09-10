export const BUTTON_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  /** Cancel and other low-commitment actions: the grey outline of the handoff. */
  TERTIARY: 'tertiary',
  GHOST: 'ghost',
  DANGER: 'danger',
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_SIZE = {
  /** The measure of the handoff's CTA: 11,5px, padding 10px 18px. */
  MD: 'md',
  /** Full-width call to action of a form card, such as the login. */
  LG: 'lg',
} as const;

export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];

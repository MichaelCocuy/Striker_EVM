export const BUTTON_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  /** Cancel and other low-commitment actions: the grey outline of the handoff. */
  TERTIARY: 'tertiary',
  GHOST: 'ghost',
  /** The quiet control of a destructive action, for a row that cannot afford a filled button. */
  GHOST_DANGER: 'ghostDanger',
  /** The quiet control over the navy of the sidebar or a band. */
  GHOST_ON_NAVY: 'ghostOnNavy',
  DANGER: 'danger',
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_SIZE = {
  /** The measure of the handoff's CTA: 11,5px, padding 10px 18px. */
  MD: 'md',
  /** Full-width call to action of a form card, such as the login. */
  LG: 'lg',
  /** 36px square whose whole content is one icon: the controls of the topbar. */
  ICON: 'icon',
  /** 32px square, for the actions of a dense list row. */
  ICON_SM: 'iconSm',
} as const;

export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];

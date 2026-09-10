export const CHIP_TONE = {
  /** Tags on the canvas and on cards. */
  SUBTLE: 'subtle',
  /** Emphasis block of the system. */
  ACCENT: 'accent',
  /**
   * The bright teal of the brand, on navy. It is the one place a bright teal carries letters,
   * so its ink is navy: white on that teal measures 1,65:1.
   */
  BRAND_ON_NAVY: 'brandOnNavy',
  /** Outlined counterpart, for the second chip of a pair on navy. */
  OUTLINE_ON_NAVY: 'outlineOnNavy',
} as const;

export type ChipTone = (typeof CHIP_TONE)[keyof typeof CHIP_TONE];

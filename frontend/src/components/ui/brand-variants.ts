export const BRAND_TILE_SIZE = {
  /** 34px: the sidebar header. */
  SM: 'sm',
  /** 40px: the login wordmark. */
  MD: 'md',
} as const;

export type BrandTileSize = (typeof BRAND_TILE_SIZE)[keyof typeof BRAND_TILE_SIZE];

export const BRAND_MARK_VARIANT = {
  /** Tile plus the product name over its discipline: the sidebar header. */
  STACKED: 'stacked',
  /** Tile plus the product name beside the `trycore` wordmark: the login. */
  WORDMARK: 'wordmark',
} as const;

export type BrandMarkVariant = (typeof BRAND_MARK_VARIANT)[keyof typeof BRAND_MARK_VARIANT];

export const BRAND_MARK_TONE = {
  /** On the canvas and on cards. */
  INK: 'ink',
  /** On the navy of the sidebar and the login. */
  ON_NAVY: 'onNavy',
} as const;

export type BrandMarkTone = (typeof BRAND_MARK_TONE)[keyof typeof BRAND_MARK_TONE];

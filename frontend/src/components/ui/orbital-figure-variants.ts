export const ORBITAL_FIGURE_VARIANT = {
  /** The 420px figure of the login's brand column: three orbits and two nodes. */
  BRAND: 'brand',
  /** The 300px figure behind the reading band (handoff §3.1): two orbits and one node. */
  BAND: 'band',
} as const;

export type OrbitalFigureVariant =
  (typeof ORBITAL_FIGURE_VARIANT)[keyof typeof ORBITAL_FIGURE_VARIANT];

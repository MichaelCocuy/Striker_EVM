import { EVM_TONE } from '@/evm/tone';

import type { EvmTone } from '@/evm/tone';

/**
 * Colours of the reading band.
 *
 * The band is the navy plane of the design system (`--tc-grad-band`) in both themes, so it
 * cannot borrow the `--evm-*` inks: those are tuned for a white card and `#A64242` on navy
 * is unreadable. The handoff therefore fixes a lighter ink per tone for this one surface,
 * plus the white alphas its furniture uses. This module is the single place those values
 * live; they belong in `styles/tokens.css`, which the shared tokens module owns.
 */

/** Traffic-light ink of the band, legible on navy (handoff §3.1). */
export const BAND_TONE_INK: Record<EvmTone, string> = {
  [EVM_TONE.GOOD]: '#86d45f',
  [EVM_TONE.NEUTRAL]: '#f2d24a',
  [EVM_TONE.BAD]: '#f08585',
  [EVM_TONE.NA]: '#9ba4c7',
};

/** Furniture of the band: the light teal of its overlines and the white alphas. */
export const BAND_INK = {
  OVERLINE: '#7fdcd8',
  HEADLINE: '#ffffff',
  BODY: 'rgb(255 255 255 / 0.68)',
  LABEL: 'rgb(255 255 255 / 0.5)',
  DIVIDER: 'rgb(255 255 255 / 0.14)',
  GAUGE_TRACK: 'rgb(255 255 255 / 0.14)',
  GAUGE_MARK: 'rgb(255 255 255 / 0.6)',
  GAUGE_MARK_LABEL: 'rgb(255 255 255 / 0.55)',
  ORBIT_OUTER: 'rgb(100 194 200 / 0.25)',
  ORBIT_INNER: 'rgb(100 194 200 / 0.18)',
  ORBIT_NODE: '#00ccc2',
} as const;

/** The band's own background, the one gradient the design system reserves for it. */
export const BAND_GRADIENT = 'var(--tc-grad-band)';

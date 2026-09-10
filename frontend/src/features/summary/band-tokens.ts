import { EVM_TONE } from '@/evm/tone';

import type { EvmTone } from '@/evm/tone';

/**
 * Colours of the reading band, as CSS values rather than literals.
 *
 * The four traffic-light inks of this surface are `--evm-*-on-navy` in `styles/tokens.css`,
 * declared next to the reason they cannot be the shared `--evm-*` ones. Everything else here
 * is expressible with what the design system already carries: `white` at an alpha for the
 * band's own furniture, and `--tc-nav-ink-active` and `--tc-orbit-node` for its two teals.
 */

/** Traffic-light ink of the band, legible on navy (handoff §3.1). */
export const BAND_TONE_INK: Record<EvmTone, string> = {
  [EVM_TONE.GOOD]: 'var(--evm-good-on-navy)',
  [EVM_TONE.NEUTRAL]: 'var(--evm-neutral-on-navy)',
  [EVM_TONE.BAD]: 'var(--evm-bad-on-navy)',
  [EVM_TONE.NA]: 'var(--evm-na-on-navy)',
};

/**
 * The same four inks as Tailwind stroke utilities: an SVG presentation attribute does not
 * accept a `var()`, so the gauge arc wears its tone as a class instead.
 */
export const BAND_TONE_STROKE_CLASS: Record<EvmTone, string> = {
  [EVM_TONE.GOOD]: 'stroke-[var(--evm-good-on-navy)]',
  [EVM_TONE.NEUTRAL]: 'stroke-[var(--evm-neutral-on-navy)]',
  [EVM_TONE.BAD]: 'stroke-[var(--evm-bad-on-navy)]',
  [EVM_TONE.NA]: 'stroke-[var(--evm-na-on-navy)]',
};

/** Furniture of the band: the light teal of its overlines and white at the handoff's alphas. */
export const BAND_INK = {
  OVERLINE: 'var(--tc-nav-ink-active)',
  HEADLINE: 'var(--color-white)',
  BODY: 'rgb(255 255 255 / 0.68)',
  LABEL: 'rgb(255 255 255 / 0.5)',
  DIVIDER: 'rgb(255 255 255 / 0.14)',
} as const;

/** The band's own background, the one gradient the design system reserves for it. */
export const BAND_GRADIENT = 'var(--tc-grad-band)';

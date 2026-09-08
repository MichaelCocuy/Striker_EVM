/**
 * Motion rules from docs/ARQUITECTURA.md §12: short durations (150–500 ms), the UI never
 * waits for an animation, and every effect collapses to its final state under
 * prefers-reduced-motion. GSAP durations are expressed in seconds.
 */
export const MOTION_DURATION_SECONDS = {
  FAST: 0.15,
  BASE: 0.3,
  SLOW: 0.5,
} as const;

export const MOTION_EASE = {
  ENTER: 'power2.out',
  EXIT: 'power2.in',
  NUMBER: 'power1.out',
  COLOR: 'sine.inOut',
} as const;

export const MOTION_OFFSET_PX = {
  PAGE_ENTER_Y: 14,
  REVEAL_Y: 18,
} as const;

export const MOTION_STAGGER_SECONDS = 0.06;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const REVEAL_ATTRIBUTE = 'data-reveal';
export const REVEAL_SELECTOR = `[${REVEAL_ATTRIBUTE}]`;

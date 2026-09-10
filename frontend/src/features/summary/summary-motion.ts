/**
 * Reveal hooks of the reading band.
 *
 * The dashboard reveals its bands with the shared `data-reveal` attribute; the cells inside
 * the band use their own attribute so the two staggers never animate the same elements.
 */
export const SUMMARY_REVEAL_ATTRIBUTE = 'data-summary-reveal';
export const SUMMARY_REVEAL_SELECTOR = `[${SUMMARY_REVEAL_ATTRIBUTE}]`;

/** Replays the stagger when the band switches between its states. */
export const SUMMARY_REVEAL_KEY = {
  LOADING: 'loading',
  READING: 'reading',
} as const;

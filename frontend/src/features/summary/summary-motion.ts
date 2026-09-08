/**
 * Reveal hooks of the summary panel.
 *
 * The dashboard reveals its cards with the shared `data-reveal` attribute; the tiles inside
 * this panel use their own attribute so the two staggers never animate the same elements.
 */
export const SUMMARY_REVEAL_ATTRIBUTE = 'data-summary-reveal';
export const SUMMARY_REVEAL_SELECTOR = `[${SUMMARY_REVEAL_ATTRIBUTE}]`;

/** Replays the stagger when the panel switches between its states. */
export const SUMMARY_REVEAL_KEY = {
  LOADING: 'loading',
  READING: 'reading',
} as const;

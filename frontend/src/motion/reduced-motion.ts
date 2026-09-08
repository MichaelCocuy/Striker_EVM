import { useSyncExternalStore } from 'react';

import { REDUCED_MOTION_QUERY } from './constants';

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/** Plain function for non-React code (GSAP helpers). */
export function prefersReducedMotion(): boolean {
  return getMediaQuery()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const media = getMediaQuery();
  if (media === null) {
    return () => undefined;
  }
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Reactive variant so components re-render when the OS setting changes. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

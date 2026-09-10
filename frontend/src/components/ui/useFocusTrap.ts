import { useEffect } from 'react';

import type { RefObject } from 'react';

const TAB_KEY = 'Tab';

/** Everything inside a dialog that the keyboard can land on, in document order. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus into the container, keeps Tab inside it while it is mounted and hands focus back
 * to whatever opened it on unmount.
 *
 * The trap is what makes a modal modal: without it Tab walks out of the dialog and into the
 * page behind, which is still there, still focusable and no longer visible to the reader. The
 * container itself is the first stop — it carries `tabIndex={-1}` — so `Shift+Tab` from the
 * first control wraps to the last instead of leaving.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    container?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== TAB_KEY || container === null) {
        return;
      }
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) {
        return;
      }
      const active = document.activeElement;
      const leavesBackwards = event.shiftKey && (active === first || active === container);
      const leavesForwards = !event.shiftKey && active === last;
      if (leavesBackwards || leavesForwards) {
        event.preventDefault();
        (leavesBackwards ? last : first).focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef]);
}

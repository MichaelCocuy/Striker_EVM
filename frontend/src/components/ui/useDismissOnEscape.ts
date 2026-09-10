import { useEffect } from 'react';

const ESCAPE_KEY = 'Escape';

/** Escape closes anything overlaid — the modal dialog and the side panel share this. */
export function useDismissOnEscape(onDismiss: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === ESCAPE_KEY) {
        onDismiss();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);
}

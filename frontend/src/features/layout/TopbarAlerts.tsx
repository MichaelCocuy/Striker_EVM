import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { IconButton } from '@/components/ui/IconButton';
import { Bell, ICON_SIZE, ICON_STROKE } from '@/components/ui/icons';

import type { RefObject } from 'react';

const COPY = {
  TRIGGER: 'Alertas',
  TITLE: 'Alertas',
  EMPTY: 'No hay alertas por ahora.',
  HINT: 'Aquí aparecerán las actividades críticas de los proyectos que sigues.',
} as const;

const ESCAPE_KEY = 'Escape';

/**
 * The bell of the topbar and the panel it opens.
 *
 * The alert feed is not part of the current API contract, so the panel states that plainly
 * instead of the button pretending to do something. Escape and a click outside close it.
 */
export function TopbarAlerts() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setIsOpen(false), []);

  useDismissOnOutsideInteraction(containerRef, isOpen, close);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <IconButton
        label={COPY.TRIGGER}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        icon={<Bell aria-hidden="true" size={ICON_SIZE.CONTENT} strokeWidth={ICON_STROKE.UI} />}
      />
      {isOpen && (
        <div
          id={panelId}
          className="card absolute right-0 z-40 mt-2 flex w-64 flex-col gap-1.5 p-[18px] shadow-raised"
        >
          <p className="eyebrow">{COPY.TITLE}</p>
          <p className="text-small font-semibold text-ink">{COPY.EMPTY}</p>
          <p className="text-caption text-ink-subtle">{COPY.HINT}</p>
        </div>
      )}
    </div>
  );
}

/** Closes the panel on Escape and on any pointer press outside of it. */
function useDismissOnOutsideInteraction(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === ESCAPE_KEY) {
        onDismiss();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const container = containerRef.current;
      if (container !== null && event.target instanceof Node && !container.contains(event.target)) {
        onDismiss();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [containerRef, isOpen, onDismiss]);
}

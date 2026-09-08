import gsap from 'gsap';
import { useEffect, useId, useLayoutEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { MOTION_DURATION_SECONDS, MOTION_EASE, MOTION_OFFSET_PX } from '@/motion/constants';
import { prefersReducedMotion } from '@/motion/reduced-motion';

import type { ReactNode, RefObject } from 'react';

const ESCAPE_KEY = 'Escape';
const CLOSE_LABEL = 'Cerrar';

/** Focuses the panel and slides it in; under reduced motion it simply appears. */
function useDialogEntrance(panelRef: RefObject<HTMLDivElement | null>): void {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    panel.focus();
    const finalState = { autoAlpha: 1, y: 0 };
    if (prefersReducedMotion()) {
      gsap.set(panel, finalState);
      return;
    }
    const tween = gsap.fromTo(
      panel,
      { autoAlpha: 0, y: MOTION_OFFSET_PX.PAGE_ENTER_Y },
      { ...finalState, duration: MOTION_DURATION_SECONDS.FAST, ease: MOTION_EASE.ENTER },
    );
    return () => {
      tween.kill();
    };
  }, [panelRef]);
}

interface ProjectDialogProps {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal shell for the portfolio's own flows (create, edit and delete confirmation), so the
 * page never falls back to `window.confirm`. Escape and the close button both dismiss it.
 */
export function ProjectDialog({ title, description, onClose, children }: ProjectDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialogEntrance(panelRef);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-canvas/80 p-4 backdrop-blur-sm md:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="card w-full max-w-lg p-6 shadow-raised focus:outline-none"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            <p id={descriptionId} className="text-sm text-ink-muted">
              {description}
            </p>
          </div>
          <Button variant={BUTTON_VARIANT.GHOST} onClick={onClose}>
            {CLOSE_LABEL}
          </Button>
        </header>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

import gsap from 'gsap';
import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { MOTION_DURATION_SECONDS, MOTION_EASE, MOTION_OFFSET_PX } from '@/motion/constants';
import { prefersReducedMotion } from '@/motion/reduced-motion';

import { IconButton } from './IconButton';
import { ICON_SIZE, ICON_STROKE, X } from './icons';
import { useDismissOnEscape } from './useDismissOnEscape';
import { useFocusTrap } from './useFocusTrap';

import type { MouseEvent, ReactNode, RefObject } from 'react';

interface ModalDialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const COPY = {
  CLOSE: 'Cerrar',
} as const;

/** The modal pop of the handoff: scale .95 → 1. */
const ENTER_SCALE = 0.95;

/**
 * Modal shell of the app: activity and project forms, and their delete confirmations.
 *
 * It renders in a portal because the page transition leaves a GSAP transform on `main`, which
 * would otherwise become the containing block of the fixed overlay. Escape, the close button and
 * a click on the backdrop all dismiss it; Tab cycles inside it and never reaches the page
 * behind, and focus returns to whatever opened it.
 */
export function ModalDialog({ title, description, onClose, children }: ModalDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef);
  useDialogEntrance(panelRef);
  useDismissOnEscape(onClose);

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy/45 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        className="card flex w-full max-w-xl flex-col gap-5 p-6 shadow-raised focus:outline-none"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-h3 font-semibold text-ink">
              {title}
            </h2>
            {description !== undefined && (
              <p id={descriptionId} className="text-small text-ink-body">
                {description}
              </p>
            )}
          </div>
          <IconButton
            label={COPY.CLOSE}
            onClick={onClose}
            icon={<X aria-hidden="true" size={ICON_SIZE.CONTENT} strokeWidth={ICON_STROKE.UI} />}
          />
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Slides and scales the panel in; under reduced motion it simply appears. */
function useDialogEntrance(panelRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }
    const finalState = { autoAlpha: 1, y: 0, scale: 1 };
    if (prefersReducedMotion()) {
      gsap.set(panel, finalState);
      return;
    }
    const tween = gsap.fromTo(
      panel,
      { autoAlpha: 0, y: MOTION_OFFSET_PX.PAGE_ENTER_Y, scale: ENTER_SCALE },
      { ...finalState, duration: MOTION_DURATION_SECONDS.FAST, ease: MOTION_EASE.ENTER },
    );
    return () => {
      tween.kill();
    };
  }, [panelRef]);
}

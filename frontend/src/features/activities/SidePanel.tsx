import gsap from 'gsap';
import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ICON_SIZE, ICON_STROKE, X } from '@/components/ui/icons';
import { useDismissOnEscape } from '@/components/ui/useDismissOnEscape';
import { useFocusTrap } from '@/components/ui/useFocusTrap';
import { MOTION_DURATION_SECONDS, MOTION_EASE } from '@/motion/constants';
import { prefersReducedMotion } from '@/motion/reduced-motion';

import type { ReactNode, RefObject } from 'react';

const COPY = {
  CLOSE: 'Cerrar',
} as const;

/** The panel slides in from the right edge, so it starts one full width off-screen. */
const OFF_SCREEN_X = '100%';
const ON_SCREEN_X = '0%';

/**
 * The teal rule on top of the header is 3 px in the handoff, which is not a step of the
 * spacing scale; it is written as a length here so the geometry stays exact.
 */
const HEADER_CLASS =
  'flex items-start justify-between gap-4 border-t-[3px] border-b border-t-accent-bright border-b-line px-6 pt-5 pb-4';

/** Padded body region; what goes inside owns its own rhythm. */
const BODY_CLASS = 'px-6 py-5';

interface SidePanelProps {
  /** Small label above the title: «{Proyecto} · {Actividad}». */
  eyebrow: string;
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Side panel of the redesign: a sheet anchored to the right edge, over a dark backdrop.
 *
 * The backdrop and the panel are **siblings**, not nested. If the panel were a child of the
 * backdrop, every click inside it would bubble to the backdrop's close handler and the panel
 * would vanish when the slider is dragged; `stopPropagation` would also work, but the sibling
 * structure does not depend on anyone remembering the handler.
 *
 * It renders in a portal because the page transition leaves a GSAP transform on `main`, which
 * would otherwise become the containing block of these fixed elements.
 */
export function SidePanel({ eyebrow, title, onClose, footer, children }: SidePanelProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useFocusTrap(panelRef);
  usePanelEntrance(backdropRef, panelRef);
  useDismissOnEscape(onClose);

  return createPortal(
    <>
      <div ref={backdropRef} className="fixed inset-0 z-40 bg-navy/60" onClick={onClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(520px,100%)] flex-col overflow-y-auto bg-surface shadow-raised focus:outline-none"
      >
        <header className={HEADER_CLASS}>
          <div className="flex flex-col gap-1">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={titleId} className="font-heading text-h2 font-bold text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.CLOSE}
            className="-mr-1 shrink-0 rounded-md p-1 text-ink-subtle transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" size={ICON_SIZE.CONTENT} strokeWidth={ICON_STROKE.UI} />
          </button>
        </header>
        <div className={BODY_CLASS}>{children}</div>
        <footer className="mt-auto flex flex-wrap justify-end gap-2.5 border-t border-line px-6 py-4">
          {footer}
        </footer>
      </aside>
    </>,
    document.body,
  );
}

/** The backdrop fades in and the panel slides from the right; both skip under reduced motion. */
function usePanelEntrance(
  backdropRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (backdrop === null || panel === null) {
      return;
    }
    const finalState = { autoAlpha: 1, xPercent: 0 };
    if (prefersReducedMotion()) {
      gsap.set([backdrop, panel], finalState);
      return;
    }
    const timeline = gsap.timeline();
    timeline.fromTo(
      backdrop,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: MOTION_DURATION_SECONDS.FAST, ease: MOTION_EASE.ENTER },
    );
    timeline.fromTo(
      panel,
      { x: OFF_SCREEN_X },
      {
        x: ON_SCREEN_X,
        duration: MOTION_DURATION_SECONDS.BASE,
        ease: MOTION_EASE.ENTER,
      },
      0,
    );
    return () => {
      timeline.kill();
    };
  }, [backdropRef, panelRef]);
}

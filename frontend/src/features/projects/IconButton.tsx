import { ICON_BUTTON_TONE } from './icon-button-tone';

import type { IconButtonTone } from './icon-button-tone';
import type { ReactNode } from 'react';

/**
 * Square icon-only button, 32 px, for the two management actions of a list row.
 *
 * The kit's `Button` is sized for a card footer and would dominate a 14 px-tall row, so this
 * is the dense variant the portfolio needs. It is a candidate for `components/ui` as an
 * icon-only size of `Button`; the accessible name always comes from `label`.
 */

const BASE_CLASSES =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150';

const TONE_CLASSES: Record<IconButtonTone, string> = {
  [ICON_BUTTON_TONE.NEUTRAL]: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  [ICON_BUTTON_TONE.DANGER]: 'text-danger hover:bg-danger-soft',
};

interface IconButtonProps {
  /** Accessible name of the action, e.g. `Editar Portal de clientes`. */
  label: string;
  icon: ReactNode;
  tone?: IconButtonTone;
  onClick: () => void;
}

export function IconButton({
  label,
  icon,
  tone = ICON_BUTTON_TONE.NEUTRAL,
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${BASE_CLASSES} ${TONE_CLASSES[tone]}`}
    >
      {icon}
    </button>
  );
}

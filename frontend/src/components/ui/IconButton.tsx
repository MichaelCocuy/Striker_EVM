import { ICON_BUTTON_TONE } from './icon-button-tones';

import type { IconButtonTone } from './icon-button-tones';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Accessible name; an icon-only control has no text to fall back on. */
  label: string;
  icon: ReactNode;
  tone?: IconButtonTone;
}

const BASE_CLASSES =
  'grid size-9 shrink-0 place-items-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const TONE_CLASSES: Record<IconButtonTone, string> = {
  [ICON_BUTTON_TONE.QUIET]: 'text-ink-muted hover:enabled:bg-surface-sunken hover:enabled:text-ink',
  [ICON_BUTTON_TONE.ON_NAVY]: 'text-white/68 hover:enabled:bg-white/9 hover:enabled:text-white',
};

/** Square control whose whole content is one icon: the bell, the theme, closing a dialog. */
export function IconButton({
  label,
  icon,
  tone = ICON_BUTTON_TONE.QUIET,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${BASE_CLASSES} ${TONE_CLASSES[tone]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}

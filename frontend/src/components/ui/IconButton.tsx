import { Button } from './Button';
import { BUTTON_SIZE, BUTTON_VARIANT } from './button-variants';
import { ICON_BUTTON_SIZE, ICON_BUTTON_TONE } from './icon-button-tones';

import type { ButtonSize, ButtonVariant } from './button-variants';
import type { IconButtonSize, IconButtonTone } from './icon-button-tones';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Accessible name; an icon-only control has no text to fall back on. */
  label: string;
  icon: ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
}

/**
 * Square control whose whole content is one icon: the bell, the theme, closing a dialog, the
 * two management actions of a list row.
 *
 * It is `Button` with the label made mandatory and the square sizes chosen for it, so there is
 * one place that owns the shapes and colours of every button in the system.
 */
const TONE_VARIANTS: Record<IconButtonTone, ButtonVariant> = {
  [ICON_BUTTON_TONE.NEUTRAL]: BUTTON_VARIANT.GHOST,
  [ICON_BUTTON_TONE.ON_NAVY]: BUTTON_VARIANT.GHOST_ON_NAVY,
  [ICON_BUTTON_TONE.DANGER]: BUTTON_VARIANT.GHOST_DANGER,
};

const SIZE_VARIANTS: Record<IconButtonSize, ButtonSize> = {
  [ICON_BUTTON_SIZE.MD]: BUTTON_SIZE.ICON,
  [ICON_BUTTON_SIZE.SM]: BUTTON_SIZE.ICON_SM,
};

export function IconButton({
  label,
  icon,
  tone = ICON_BUTTON_TONE.NEUTRAL,
  size = ICON_BUTTON_SIZE.MD,
  ...rest
}: IconButtonProps) {
  return (
    <Button
      variant={TONE_VARIANTS[tone]}
      size={SIZE_VARIANTS[size]}
      aria-label={label}
      title={label}
      {...rest}
    >
      {icon}
    </Button>
  );
}

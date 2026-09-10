import { THEMES } from '@/theme/theme-constants';
import { useTheme } from '@/theme/useTheme';

import { ICON_BUTTON_TONE } from './icon-button-tones';
import { IconButton } from './IconButton';
import { ICON_SIZE, ICON_STROKE, Moon, Sun } from './icons';

import type { IconButtonTone } from './icon-button-tones';

const LABEL_TO_DARK = 'Cambiar a tema oscuro';
const LABEL_TO_LIGHT = 'Cambiar a tema claro';

interface ThemeToggleProps {
  /** `ON_NAVY` for the login and any navy band; the topbar keeps the default. */
  tone?: IconButtonTone;
}

export function ThemeToggle({ tone = ICON_BUTTON_TONE.NEUTRAL }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;
  const label = isDark ? LABEL_TO_LIGHT : LABEL_TO_DARK;
  const Glyph = isDark ? Sun : Moon;

  return (
    <IconButton
      label={label}
      tone={tone}
      onClick={toggleTheme}
      aria-pressed={isDark}
      icon={<Glyph aria-hidden="true" size={ICON_SIZE.CONTENT} strokeWidth={ICON_STROKE.UI} />}
    />
  );
}

import { THEMES } from '@/theme/theme-constants';
import { useTheme } from '@/theme/useTheme';

const LABEL_TO_DARK = 'Cambiar a tema oscuro';
const LABEL_TO_LIGHT = 'Cambiar a tema claro';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;
  const label = isDark ? LABEL_TO_LIGHT : LABEL_TO_DARK;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className="grid size-10 place-items-center rounded-md border border-line bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

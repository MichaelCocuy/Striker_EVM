import { BUTTON_SIZE, BUTTON_VARIANT } from './button-variants';

import type { ButtonSize, ButtonVariant } from './button-variants';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Measure of the button; the handoff's CTA size is the default. */
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 font-heading font-semibold transition-[background-color,box-shadow,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-60 active:enabled:translate-y-px';

/**
 * Shape, case and colour of each variant.
 *
 * The four emphatic variants are pills in uppercase with the tracking of the system; `ghost`
 * is the quiet one (logout, dismiss) and keeps sentence case on the 4px radius. `secondary`
 * outlines in `--ink`, which is the handoff's navy in the light theme and stays legible in the
 * dark one.
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [BUTTON_VARIANT.PRIMARY]:
    'rounded-pill uppercase tracking-[1.2px] bg-[image:var(--tc-grad-cta)] text-white hover:enabled:shadow-glow',
  [BUTTON_VARIANT.SECONDARY]:
    'rounded-pill uppercase tracking-[1.2px] border-[1.5px] border-ink bg-transparent text-ink hover:enabled:bg-accent-soft',
  [BUTTON_VARIANT.TERTIARY]:
    'rounded-pill uppercase tracking-[1.2px] border-[1.5px] border-line-strong bg-transparent text-ink-muted hover:enabled:bg-surface-sunken',
  [BUTTON_VARIANT.DANGER]:
    'rounded-pill uppercase tracking-[1.2px] bg-danger-soft text-danger hover:enabled:bg-danger hover:enabled:text-white',
  [BUTTON_VARIANT.GHOST]:
    'rounded-md text-ink-muted hover:enabled:bg-surface-sunken hover:enabled:text-ink',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  [BUTTON_SIZE.MD]: 'px-[18px] py-[10px] text-[11.5px]',
  [BUTTON_SIZE.LG]: 'px-5 py-[13px] text-small',
};

export function Button({
  variant = BUTTON_VARIANT.PRIMARY,
  size = BUTTON_SIZE.MD,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
    />
  );
}

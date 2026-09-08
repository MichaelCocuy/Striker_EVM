import { BUTTON_VARIANT } from './button-variants';

import type { ButtonVariant } from './button-variants';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-[background-color,box-shadow,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-60 active:enabled:scale-[0.98]';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [BUTTON_VARIANT.PRIMARY]: 'bg-accent text-accent-ink shadow-glow hover:enabled:bg-accent-hover',
  [BUTTON_VARIANT.SECONDARY]:
    'border border-line-strong bg-surface text-ink hover:enabled:bg-surface-sunken',
  [BUTTON_VARIANT.GHOST]: 'text-ink-muted hover:enabled:bg-surface-sunken hover:enabled:text-ink',
  [BUTTON_VARIANT.DANGER]: 'bg-danger-soft text-danger hover:enabled:brightness-95',
};

export function Button({
  variant = BUTTON_VARIANT.PRIMARY,
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
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
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

import { useId } from 'react';

import type { ReactNode } from 'react';

/** Attributes the shell computes for whatever control it wraps. */
export interface FieldControlAttributes {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
  className: string;
}

interface FieldShellProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string;
  children: (control: FieldControlAttributes) => ReactNode;
}

const CONTROL_BASE_CLASS =
  'w-full rounded-md border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring';
const CONTROL_BORDER_CLASS = { VALID: 'border-line-strong', INVALID: 'border-danger' } as const;
const MESSAGE_SUFFIX = '-message';

/**
 * Label, control and message of a form field, in one place.
 *
 * The three fields of the kit (text, select and textarea) differ only in the element they
 * render, so the shell owns the id wiring, the error/hint precedence, the `aria-invalid` and
 * `aria-describedby` attributes and the control's styling, and hands them to its child.
 */
export function FieldShell({ label, error, hint, className = '', children }: FieldShellProps) {
  const fieldId = useId();
  const messageId = `${fieldId}${MESSAGE_SUFFIX}`;
  const hasError = error !== undefined && error !== '';
  const message = hasError ? error : hint;
  const borderClass = hasError ? CONTROL_BORDER_CLASS.INVALID : CONTROL_BORDER_CLASS.VALID;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id: fieldId,
        'aria-invalid': hasError || undefined,
        'aria-describedby': message ? messageId : undefined,
        className: `${CONTROL_BASE_CLASS} ${borderClass}`,
      })}
      {message && (
        <p
          id={messageId}
          role={hasError ? 'alert' : undefined}
          className={`text-sm ${hasError ? 'text-danger' : 'text-ink-subtle'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

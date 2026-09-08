import { useId } from 'react';

import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}

/** Labeled select with the same message and focus behaviour as the shared TextField. */
export function SelectField({
  label,
  error,
  hint,
  children,
  className = '',
  ...selectProps
}: SelectFieldProps) {
  const selectId = useId();
  const messageId = `${selectId}-message`;
  const hasError = error !== undefined && error !== '';
  const message = hasError ? error : hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={hasError || undefined}
        aria-describedby={message ? messageId : undefined}
        className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring ${
          hasError ? 'border-danger' : 'border-line-strong'
        }`}
        {...selectProps}
      >
        {children}
      </select>
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

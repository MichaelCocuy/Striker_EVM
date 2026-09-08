import { useId } from 'react';

import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

export function TextField({ label, error, hint, className = '', ...inputProps }: TextFieldProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const hasError = error !== undefined && error !== '';
  const message = hasError ? error : hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={hasError || undefined}
        aria-describedby={message ? messageId : undefined}
        className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring ${
          hasError ? 'border-danger' : 'border-line-strong'
        }`}
        {...inputProps}
      />
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

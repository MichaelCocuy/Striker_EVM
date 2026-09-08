import { useId } from 'react';

import type { TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

const DEFAULT_ROWS = 3;

/**
 * Multi-line counterpart of `components/ui/TextField`, kept here because the shared UI kit
 * belongs to another module. Promoting it to `components/ui` is the natural follow-up.
 */
export function TextAreaField({
  label,
  error,
  hint,
  className = '',
  rows = DEFAULT_ROWS,
  ...textAreaProps
}: TextAreaFieldProps) {
  const fieldId = useId();
  const messageId = `${fieldId}-message`;
  const hasError = error !== undefined && error !== '';
  const message = hasError ? error : hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-describedby={message ? messageId : undefined}
        className={`w-full resize-y rounded-md border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring ${
          hasError ? 'border-danger' : 'border-line-strong'
        }`}
        {...textAreaProps}
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

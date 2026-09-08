import { FieldShell } from './FieldShell';

import type { TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

const DEFAULT_ROWS = 3;
const RESIZE_CLASS = 'resize-y';

/** Multi-line labeled input. */
export function TextAreaField({
  label,
  error,
  hint,
  className = '',
  rows = DEFAULT_ROWS,
  ...textAreaProps
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {(control) => (
        <textarea
          {...control}
          className={`${control.className} ${RESIZE_CLASS}`}
          rows={rows}
          {...textAreaProps}
        />
      )}
    </FieldShell>
  );
}

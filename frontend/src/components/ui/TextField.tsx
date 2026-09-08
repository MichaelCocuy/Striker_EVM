import { FieldShell } from './FieldShell';

import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Single-line labeled input. */
export function TextField({ label, error, hint, className = '', ...inputProps }: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {(control) => <input {...control} {...inputProps} />}
    </FieldShell>
  );
}

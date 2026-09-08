import { FieldShell } from './FieldShell';

import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}

/** Labeled select; the options are the children. */
export function SelectField({
  label,
  error,
  hint,
  children,
  className = '',
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {(control) => (
        <select {...control} {...selectProps}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

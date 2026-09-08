import { useCallback } from 'react';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ROLE_LABEL } from '@/components/ui/role-labels';

import { SelectField } from './SelectField';

const COPY = {
  LABEL: 'Responsable',
  HINT: 'Quien registra el avance de la actividad.',
  PLACEHOLDER: 'Selecciona un responsable',
  LOADING: 'Cargando responsables…',
  RETRY: 'Reintentar',
} as const;

interface OwnerSelectProps {
  value: string;
  error?: string | undefined;
  onChange: (ownerId: string) => void;
}

/**
 * Owner picker fed by `GET /users`, which only REVIEWER may call (ARQUITECTURA §11), so this
 * field is rendered only for that role. REGISTRAR sends no `ownerId` and the backend assigns
 * the activity to them.
 */
export function OwnerSelect({ value, error, onChange }: OwnerSelectProps) {
  const fetchUsers = useCallback(() => api.listUsers(), []);
  const users = useApiQuery(fetchUsers);
  const isLoading = users.status === 'loading';
  const options = users.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <SelectField
        label={COPY.LABEL}
        hint={COPY.HINT}
        error={users.error?.message ?? error}
        value={value}
        disabled={isLoading}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{isLoading ? COPY.LOADING : COPY.PLACEHOLDER}</option>
        {options.map((user) => (
          <option key={user.id} value={user.id}>
            {`${user.fullName} · ${ROLE_LABEL[user.role]}`}
          </option>
        ))}
      </SelectField>
      {users.status === 'error' && (
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={users.refetch}>
          {COPY.RETRY}
        </Button>
      )}
    </div>
  );
}

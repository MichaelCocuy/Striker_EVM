import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { SEED_PASSWORD, SEED_USERS } from '@/mocks/seed';

import type { LoginRequest } from '@/api/types';

const COPY = {
  NOTE: `Entorno de demostración · contraseña ${SEED_PASSWORD}`,
  USE: 'Usar',
  USE_ACCOUNT: 'Usar la cuenta',
} as const;

interface MockCredentialsHintProps {
  /** Fills the form with a seed account, so an evaluator can enter as either role. */
  onUseCredentials: (credentials: LoginRequest) => void;
}

/** Only loaded when VITE_USE_MOCKS=true; lists the seed accounts for local demos. */
export default function MockCredentialsHint({ onUseCredentials }: MockCredentialsHintProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="text-caption text-ink-subtle">{COPY.NOTE}</p>
      <ul className="flex flex-col gap-1.5">
        {SEED_USERS.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-caption text-ink-body">{user.email}</span>
            <span className="flex shrink-0 items-center gap-2">
              <RoleBadge role={user.role} />
              <Button
                variant={BUTTON_VARIANT.GHOST}
                aria-label={`${COPY.USE_ACCOUNT} ${user.email}`}
                onClick={() => onUseCredentials({ email: user.email, password: SEED_PASSWORD })}
              >
                {COPY.USE}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

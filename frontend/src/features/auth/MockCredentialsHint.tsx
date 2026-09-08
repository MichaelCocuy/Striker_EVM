import { RoleBadge } from '@/components/ui/RoleBadge';
import { SEED_PASSWORD, SEED_USERS } from '@/mocks/seed';

const COPY = {
  TITLE: 'Modo demo con datos simulados',
  DESCRIPTION: 'El backend no está conectado; usa cualquiera de estas cuentas:',
  PASSWORD_LABEL: 'Contraseña',
} as const;

/** Only loaded when VITE_USE_MOCKS=true; lists the seed accounts for local demos. */
export default function MockCredentialsHint() {
  return (
    <aside className="card flex flex-col gap-3 p-5 text-sm" aria-label={COPY.TITLE}>
      <p className="font-semibold text-ink">{COPY.TITLE}</p>
      <p className="text-ink-muted">{COPY.DESCRIPTION}</p>
      <ul className="flex flex-col gap-2">
        {SEED_USERS.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3">
            <code className="font-mono text-xs text-ink">{user.email}</code>
            <RoleBadge role={user.role} />
          </li>
        ))}
      </ul>
      <p className="text-ink-muted">
        {COPY.PASSWORD_LABEL}: <code className="font-mono text-xs text-ink">{SEED_PASSWORD}</code>
      </p>
    </aside>
  );
}

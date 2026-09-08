import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

const COPY = {
  EYEBROW: 'Error 404',
  TITLE: 'Esta página no existe',
  DESCRIPTION: 'Revisa la dirección o vuelve al inicio para continuar.',
  HOME_LINK: 'Volver al inicio',
} as const;

export function NotFoundPage() {
  return (
    <section className="card mx-auto flex max-w-lg flex-col items-start gap-4 p-8">
      <p className="eyebrow">{COPY.EYEBROW}</p>
      <h1 className="text-2xl font-semibold text-ink">{COPY.TITLE}</h1>
      <p className="text-ink-muted">{COPY.DESCRIPTION}</p>
      <Link to={ROUTES.ROOT} className="text-sm font-semibold text-accent hover:underline">
        {COPY.HOME_LINK}
      </Link>
    </section>
  );
}

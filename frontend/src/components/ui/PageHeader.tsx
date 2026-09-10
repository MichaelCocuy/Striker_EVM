import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-h1 font-bold text-ink">{title}</h1>
        {description && <div className="max-w-2xl text-small text-ink-body">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

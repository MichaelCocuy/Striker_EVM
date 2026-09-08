import type { ReactNode } from 'react';

interface SummarySectionProps {
  heading: string;
  /** One line explaining what the group of indicators is for. */
  hint: string;
  /** Grid classes for the definition list that holds the indicators. */
  listClassName: string;
  children: ReactNode;
}

/** A titled group of indicators rendered as a definition list. */
export function SummarySection({ heading, hint, listClassName, children }: SummarySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink">{heading}</h3>
        <p className="text-xs text-ink-muted">{hint}</p>
      </header>
      <dl className={`grid gap-3 ${listClassName}`}>{children}</dl>
    </section>
  );
}

import { useId, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { PORTFOLIO_COPY, projectCountLabel } from './portfolio-copy';
import { PORTFOLIO_LAYOUT } from './portfolio-layout';
import { ProjectListRow } from './ProjectListRow';

import type { PortfolioItem } from './portfolio-items';
import type { Project } from '@/api/types';

/** Dense list of the portfolio: with eight projects a list lets the reviewer compare. */

const HEADING_CLASSES = 'font-heading text-h3 font-semibold text-ink';

interface ProjectListProps {
  items: readonly PortfolioItem[];
  /** REVIEWER-only actions; the backend answers 403 for anyone else. */
  canManage: boolean;
  onCreate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectList({ items, canManage, onCreate, onEdit, onDelete }: ProjectListProps) {
  const headingId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  useStaggerReveal(listRef, { revealKey: items.length });

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <h2 id={headingId} className={HEADING_CLASSES}>
          {projectCountLabel(items.length)}
        </h2>
        {canManage && <Button onClick={onCreate}>{PORTFOLIO_COPY.NEW_PROJECT}</Button>}
      </header>

      <ul ref={listRef} className={PORTFOLIO_LAYOUT.ROW_STACK}>
        {items.map((item) => (
          <li key={item.entry.project.id}>
            <ProjectListRow item={item} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </section>
  );
}

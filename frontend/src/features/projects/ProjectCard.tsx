import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { projectDashboardPath } from '@/constants/routes';
import { formatIndex } from '@/lib/format';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

import { ProjectStatusPills } from './ProjectStatusPills';

import type { PortfolioEntry } from './usePortfolio';
import type { Project } from '@/api/types';

const COPY = {
  NO_DESCRIPTION: 'Sin descripción.',
  ACTIVITY_SINGULAR: 'actividad',
  ACTIVITY_PLURAL: 'actividades',
  STATUS_UNAVAILABLE_HINT: 'No pudimos leer el reporte de este proyecto. Ábrelo para reintentar.',
  ACTIONS_LABEL: 'Acciones del proyecto',
  CPI: 'CPI',
  SPI: 'SPI',
  EDIT: 'Editar',
  DELETE: 'Eliminar',
} as const;

const SINGLE_ACTIVITY = 1;

function activityCountLabel(count: number): string {
  return `${count} ${count === SINGLE_ACTIVITY ? COPY.ACTIVITY_SINGULAR : COPY.ACTIVITY_PLURAL}`;
}

interface ProjectCardProps {
  entry: PortfolioEntry;
  /** REVIEWER-only actions; the backend answers 403 for anyone else. */
  canManage: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

/** Portfolio tile: identity, size and the consolidated traffic light of one project. */
export function ProjectCard({ entry, canManage, onEdit, onDelete }: ProjectCardProps) {
  const { project, indicators } = entry;

  return (
    <article
      {...{ [REVEAL_ATTRIBUTE]: true }}
      className="card relative flex flex-col gap-4 p-6 transition-shadow duration-150 hover:shadow-raised"
    >
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{activityCountLabel(project.activityCount)}</p>
        <h3 className="text-lg font-semibold text-ink">
          {/* The pseudo-element turns the whole card into the link's hit area. */}
          <Link
            to={projectDashboardPath(project.id)}
            className="transition-colors duration-150 after:absolute after:inset-0 after:content-[''] hover:text-accent"
          >
            {project.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-muted">{project.description ?? COPY.NO_DESCRIPTION}</p>
      </div>

      <ProjectStatusPills indicators={indicators} />

      {indicators === null ? (
        <p className="text-sm text-ink-subtle">{COPY.STATUS_UNAVAILABLE_HINT}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-ink-subtle">{COPY.CPI}</dt>
            <dd className="numeric text-base font-semibold text-ink">
              {formatIndex(indicators.costPerformanceIndex)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-ink-subtle">{COPY.SPI}</dt>
            <dd className="numeric text-base font-semibold text-ink">
              {formatIndex(indicators.schedulePerformanceIndex)}
            </dd>
          </div>
        </dl>
      )}

      {canManage && (
        <div
          role="group"
          aria-label={COPY.ACTIONS_LABEL}
          className="relative z-10 mt-auto flex flex-wrap gap-2 border-t border-line pt-4"
        >
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            aria-label={`${COPY.EDIT} ${project.name}`}
            onClick={() => onEdit(project)}
          >
            {COPY.EDIT}
          </Button>
          <Button
            variant={BUTTON_VARIANT.DANGER}
            aria-label={`${COPY.DELETE} ${project.name}`}
            onClick={() => onDelete(project)}
          >
            {COPY.DELETE}
          </Button>
        </div>
      )}
    </article>
  );
}

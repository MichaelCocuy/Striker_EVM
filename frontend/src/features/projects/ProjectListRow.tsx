import { Link } from 'react-router-dom';

import { projectDashboardPath } from '@/constants/routes';
import { EVM_TONE, EVM_TONE_TOKENS, costStatusTone, scheduleStatusTone } from '@/evm/tone';
import { formatIndex } from '@/lib/format';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

import { ICON_BUTTON_TONE } from './icon-button-tone';
import { IconButton } from './IconButton';
import { activityCountLabel, PORTFOLIO_COPY } from './portfolio-copy';
import { PORTFOLIO_LAYOUT } from './portfolio-layout';
import { ArrowRightIcon, PencilIcon, TrashIcon } from './PortfolioIcons';
import { ProjectStatusPills } from './ProjectStatusPills';

import type { PortfolioItem } from './portfolio-items';
import type { EvmIndicators, Project } from '@/api/types';

/**
 * One row of the dense portfolio list: number, identity with its two traffic lights, and the
 * two indices in the ink of their own semaphore.
 *
 * The row is the navigation target — the project name is a real link whose hit area covers the
 * whole card — and the reviewer's two management actions sit above it in their own group.
 */

const ROW_CLASSES = `relative grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3.5 transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-card ${PORTFOLIO_LAYOUT.ROW}`;
const NUMBER_CLASSES = 'font-heading text-[11px] font-bold text-ink-subtle';
const NAME_CLASSES = 'truncate font-heading text-[14.5px] font-semibold text-ink';
const INDEX_LABEL_CLASSES = 'font-heading text-badge font-bold tracking-wide text-ink-subtle';
const INDEX_VALUE_CLASSES = 'numeric text-[16px]';
const ACTIVITY_COUNT_CLASSES = 'text-[11px] text-ink-subtle';

interface IndexReadoutProps {
  label: string;
  /** The index as the report brings it; `null` prints the not-computable mark. */
  value: number | null;
  colorToken: string;
}

function IndexReadout({ label, value, colorToken }: IndexReadoutProps) {
  return (
    <div className="text-right">
      <div className={INDEX_LABEL_CLASSES}>{label}</div>
      <div className={INDEX_VALUE_CLASSES} style={{ color: `var(${colorToken})` }}>
        {formatIndex(value)}
      </div>
    </div>
  );
}

/** Ink of each index: the CPI wears the cost tone and the SPI the schedule tone. */
function indexColorTokens(indicators: EvmIndicators | null): { cost: string; schedule: string } {
  if (indicators === null) {
    const { colorToken } = EVM_TONE_TOKENS[EVM_TONE.NA];
    return { cost: colorToken, schedule: colorToken };
  }
  return {
    cost: EVM_TONE_TOKENS[costStatusTone(indicators.costStatus)].colorToken,
    schedule: EVM_TONE_TOKENS[scheduleStatusTone(indicators.scheduleStatus)].colorToken,
  };
}

interface ProjectListRowProps {
  item: PortfolioItem;
  /** REVIEWER-only actions; the backend answers 403 for anyone else. */
  canManage: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectListRow({ item, canManage, onEdit, onDelete }: ProjectListRowProps) {
  const { project, indicators } = item.entry;
  const tokens = indexColorTokens(indicators);

  return (
    <article {...{ [REVEAL_ATTRIBUTE]: true }} className={ROW_CLASSES}>
      <span className={NUMBER_CLASSES}>{item.number}</span>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className={NAME_CLASSES}>
          {/* The pseudo-element turns the whole row into the link's hit area. */}
          <Link
            to={projectDashboardPath(project.id)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <ProjectStatusPills indicators={indicators} />
          <span className={ACTIVITY_COUNT_CLASSES}>
            {activityCountLabel(project.activityCount)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <IndexReadout
          label={PORTFOLIO_COPY.LIST.CPI}
          value={indicators?.costPerformanceIndex ?? null}
          colorToken={tokens.cost}
        />
        <IndexReadout
          label={PORTFOLIO_COPY.LIST.SPI}
          value={indicators?.schedulePerformanceIndex ?? null}
          colorToken={tokens.schedule}
        />
        {canManage && (
          <div
            role="group"
            aria-label={PORTFOLIO_COPY.LIST.ACTIONS_LABEL}
            className="relative z-10 flex items-center gap-1"
          >
            <IconButton
              label={`${PORTFOLIO_COPY.LIST.EDIT} ${project.name}`}
              icon={<PencilIcon />}
              onClick={() => {
                onEdit(project);
              }}
            />
            <IconButton
              label={`${PORTFOLIO_COPY.LIST.DELETE} ${project.name}`}
              icon={<TrashIcon />}
              tone={ICON_BUTTON_TONE.DANGER}
              onClick={() => {
                onDelete(project);
              }}
            />
          </div>
        )}
        <ArrowRightIcon className="text-ink-subtle" />
      </div>
    </article>
  );
}

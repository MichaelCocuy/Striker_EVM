import { Link } from 'react-router-dom';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ArrowRight, ICON_SIZE, ICON_STROKE } from '@/components/ui/icons';
import { MONEY_DECIMALS } from '@/lib/format';

import { activityDeviation } from './activity-deviation';
import { INDICATOR_KIND, TABLE_INDICATORS } from './activity-indicators';
import { ACTIVITY_COLUMN_LABELS, TABLE_CLASS, TABLE_ROLE } from './activity-table';
import { ActivityDeviationGlyph } from './ActivityDeviationGlyph';
import { ActivityIndexChip } from './ActivityIndexChip';
import { ActivityProgressBar } from './ActivityProgressBar';

import type { ActivityMeasures, EvmIndicators, UserSummary } from '@/api/types';
import type { MouseEvent } from 'react';

const COPY = {
  OWNER_PREFIX: `${ACTIVITY_COLUMN_LABELS.OWNER}: `,
} as const;

interface StackLabelProps {
  label: string;
}

/** The column name, repeated inside the cell for when the row reads as a card. */
function StackLabel({ label }: StackLabelProps) {
  return (
    <span aria-hidden="true" className={TABLE_CLASS.STACK_LABEL}>
      {label}
    </span>
  );
}

interface ActivityNameCellProps {
  name: string;
  owner: UserSummary;
  /** Explanations the report attaches to the activity (EVM_GUIA §5); they stay visible. */
  notes: readonly string[];
  /** Path of the activity detail, so the row is reachable with the keyboard too. */
  detailPath: string;
}

/**
 * The activity and who answers for it, one above the other, as the row's header.
 *
 * The name is the link to the detail: the whole row navigates on click, but a link is what
 * makes that destination reachable by keyboard, so the link owns its own click and the row
 * only follows it for the mouse.
 */
export function ActivityNameCell({ name, owner, notes, detailPath }: ActivityNameCellProps) {
  function keepClickOnTheLink(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <th scope="row" role={TABLE_ROLE.ROW_HEADER} className={TABLE_CLASS.NAME_CELL}>
      <Link
        to={detailPath}
        onClick={keepClickOnTheLink}
        className="font-heading text-small font-semibold text-ink hover:text-accent"
      >
        {name}
      </Link>
      <span className="mt-0.5 block text-caption font-normal text-ink-subtle">
        <span className="sr-only">{COPY.OWNER_PREFIX}</span>
        <span>{owner.fullName}</span>
      </span>
      {notes.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-caption font-normal text-ink-subtle">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </th>
  );
}

interface ActivityMeasureCellsProps {
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

/** Which side of the plan the activity is on, and how far the bar is from the planned fill. */
export function ActivityMeasureCells({ input, indicators }: ActivityMeasureCellsProps) {
  return (
    <>
      <td role={TABLE_ROLE.CELL} className={TABLE_CLASS.CELL}>
        <StackLabel label={ACTIVITY_COLUMN_LABELS.DEVIATION} />
        <ActivityDeviationGlyph deviation={activityDeviation(input)} />
      </td>
      <td role={TABLE_ROLE.CELL} className={`${TABLE_CLASS.CELL} min-w-40`}>
        <StackLabel label={ACTIVITY_COLUMN_LABELS.PROGRESS} />
        <ActivityProgressBar input={input} indicators={indicators} />
      </td>
    </>
  );
}

interface ActivityIndicatorCellsProps {
  indicators: EvmIndicators;
}

/**
 * One cell per indicator, exactly as the report brings it, in the order of
 * `TABLE_INDICATORS`: money counts up towards the new number when the report is refetched,
 * an index wears its traffic light and a `null` renders as an em dash.
 */
export function ActivityIndicatorCells({ indicators }: ActivityIndicatorCellsProps) {
  return (
    <>
      {TABLE_INDICATORS.map((indicator) =>
        indicator.kind === INDICATOR_KIND.INDEX ? (
          <td key={indicator.key} role={TABLE_ROLE.CELL} className={TABLE_CLASS.CHIP_CELL}>
            <StackLabel label={indicator.label} />
            <ActivityIndexChip index={indicator} indicators={indicators} />
          </td>
        ) : (
          <td key={indicator.key} role={TABLE_ROLE.CELL} className={TABLE_CLASS.NUMERIC_CELL}>
            <StackLabel label={indicator.label} />
            <AnimatedNumber value={indicators[indicator.key]} decimals={MONEY_DECIMALS} />
          </td>
        ),
      )}
    </>
  );
}

/** Last cell of the row: the arrow that says the row leads somewhere. */
export function ActivityDetailArrowCell() {
  return (
    <td role={TABLE_ROLE.CELL} className={`${TABLE_CLASS.CELL} text-right max-[700px]:hidden`}>
      <ArrowRight
        aria-hidden="true"
        size={ICON_SIZE.COMPACT}
        strokeWidth={ICON_STROKE.UI}
        className="inline-block text-ink-subtle"
      />
    </td>
  );
}

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { MONEY_DECIMALS } from '@/lib/format';

import { activityDeviation } from './activity-deviation';
import {
  ACTIVITY_COLUMN_KIND,
  ACTIVITY_COLUMN_LABELS,
  ACTIVITY_INDICATOR_COLUMNS,
  TABLE_CLASS,
  TABLE_ROLE,
} from './activity-table';
import { ActivityDeviationGlyph } from './ActivityDeviationGlyph';
import { ActivityIndexPill } from './ActivityIndexPill';
import { ActivityProgressBar } from './ActivityProgressBar';

import type { ActivityMeasures, EvmIndicators, UserSummary } from '@/api/types';
import type { ReactNode } from 'react';

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
}

/** The activity and who answers for it, one above the other, as the row's header. */
export function ActivityNameCell({ name, owner, notes }: ActivityNameCellProps) {
  return (
    <th scope="row" role={TABLE_ROLE.ROW_HEADER} className={TABLE_CLASS.NAME_CELL}>
      <span className="block font-semibold text-ink">{name}</span>
      <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
        <span className="sr-only">{COPY.OWNER_PREFIX}</span>
        <span>{owner.fullName}</span>
      </span>
      {notes.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-xs font-normal text-ink-subtle">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </th>
  );
}

interface ActivityTextCellProps {
  label: string;
  value: string;
}

/** Plain text column, used for the project the activity belongs to. */
export function ActivityTextCell({ label, value }: ActivityTextCellProps) {
  return (
    <td role={TABLE_ROLE.CELL} className={TABLE_CLASS.CELL}>
      <StackLabel label={label} />
      <span>{value}</span>
    </td>
  );
}

interface ActivityMeasureCellsProps {
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

/** Which side of the plan the activity is on, and how far the bar is from its marker. */
export function ActivityMeasureCells({ input, indicators }: ActivityMeasureCellsProps) {
  return (
    <>
      <td role={TABLE_ROLE.CELL} className={TABLE_CLASS.CELL}>
        <StackLabel label={ACTIVITY_COLUMN_LABELS.DEVIATION} />
        <ActivityDeviationGlyph deviation={activityDeviation(input)} />
      </td>
      <td role={TABLE_ROLE.CELL} className={`${TABLE_CLASS.CELL} min-w-52`}>
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
 * `ACTIVITY_INDICATOR_COLUMNS`: money counts up towards the new number when the report is
 * refetched, an index wears its traffic light and a `null` renders as an em dash.
 */
export function ActivityIndicatorCells({ indicators }: ActivityIndicatorCellsProps) {
  return (
    <>
      {ACTIVITY_INDICATOR_COLUMNS.map((column) => (
        <td key={column.key} role={TABLE_ROLE.CELL} className={TABLE_CLASS.NUMERIC_CELL}>
          <StackLabel label={column.label} />
          {column.kind === ACTIVITY_COLUMN_KIND.INDEX ? (
            <ActivityIndexPill column={column} indicators={indicators} />
          ) : (
            <AnimatedNumber value={indicators[column.key]} decimals={MONEY_DECIMALS} />
          )}
        </td>
      ))}
    </>
  );
}

interface ActivityActionsCellProps {
  children: ReactNode;
}

/** Last cell of the row; the buttons inside follow the permission matrix of ARQUITECTURA §11. */
export function ActivityActionsCell({ children }: ActivityActionsCellProps) {
  return (
    <td role={TABLE_ROLE.CELL} className={TABLE_CLASS.CELL}>
      <span className="flex flex-wrap justify-end gap-2 max-[700px]:justify-start">{children}</span>
    </td>
  );
}

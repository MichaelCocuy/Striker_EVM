import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { formatIndex, formatMoney } from '@/lib/format';

import { SERIES_KEYS } from './chart-config';

import type { ActivityBarRow } from './activity-bars';

const COPY = {
  CAPTION: 'PV, EV, AC y BAC por actividad',
  ACTIVITY_COLUMN: 'Actividad',
} as const;

const COLUMNS = [
  INDICATORS.PLANNED_VALUE,
  INDICATORS.EARNED_VALUE,
  INDICATORS.ACTUAL_COST,
  INDICATORS.BUDGET_AT_COMPLETION,
  INDICATORS.COST_PERFORMANCE_INDEX,
  INDICATORS.SCHEDULE_PERFORMANCE_INDEX,
] as const;

interface ActivityValuesTableProps {
  rows: readonly ActivityBarRow[];
}

/**
 * Accessible equivalent of the bars: an SVG plot says nothing to a screen reader, so the
 * same numbers are exposed as a visually hidden table whose headers name each indicator.
 */
export function ActivityValuesTable({ rows }: ActivityValuesTableProps) {
  return (
    <table className="sr-only">
      <caption>{COPY.CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col">{COPY.ACTIVITY_COLUMN}</th>
          {COLUMNS.map((column) => (
            <th key={column.acronym} scope="col">
              {`${column.acronym} — ${column.name}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row">{row.name}</th>
            <td>{formatMoney(row[SERIES_KEYS.PLANNED_VALUE])}</td>
            <td>{formatMoney(row[SERIES_KEYS.EARNED_VALUE])}</td>
            <td>{formatMoney(row[SERIES_KEYS.ACTUAL_COST])}</td>
            <td>{formatMoney(row.budgetAtCompletion)}</td>
            <td>{formatIndex(row.costPerformanceIndex)}</td>
            <td>{formatIndex(row.schedulePerformanceIndex)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { formatIndex, formatMoney } from '@/lib/format';

import { SERIES_KEYS } from './chart-config';

import type { ChartRow } from './chart-rows';

const COPY = {
  CAPTION: 'PV, EV y AC por actividad',
  COLUMNS: {
    ACTIVITY: 'Actividad',
    PLANNED_VALUE: 'PV',
    EARNED_VALUE: 'EV',
    ACTUAL_COST: 'AC',
    CPI: 'CPI',
    SPI: 'SPI',
  },
} as const;

interface ActivityValuesTableProps {
  rows: readonly ChartRow[];
}

/**
 * Accessible equivalent of the chart: an SVG plot says nothing to a screen reader, so the
 * same numbers are exposed as a visually hidden table with headers.
 */
export function ActivityValuesTable({ rows }: ActivityValuesTableProps) {
  return (
    <table className="sr-only">
      <caption>{COPY.CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col">{COPY.COLUMNS.ACTIVITY}</th>
          <th scope="col">{COPY.COLUMNS.PLANNED_VALUE}</th>
          <th scope="col">{COPY.COLUMNS.EARNED_VALUE}</th>
          <th scope="col">{COPY.COLUMNS.ACTUAL_COST}</th>
          <th scope="col">{COPY.COLUMNS.CPI}</th>
          <th scope="col">{COPY.COLUMNS.SPI}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row">{row.name}</th>
            <td>{formatMoney(row[SERIES_KEYS.PLANNED_VALUE])}</td>
            <td>{formatMoney(row[SERIES_KEYS.EARNED_VALUE])}</td>
            <td>{formatMoney(row[SERIES_KEYS.ACTUAL_COST])}</td>
            <td>{formatIndex(row.costPerformanceIndex)}</td>
            <td>{formatIndex(row.schedulePerformanceIndex)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { formatIndex, formatMoney } from '@/lib/format';

import type { QuadrantPoint } from './quadrant-points';

const COPY = {
  CAPTION: 'CPI y SPI por actividad, con su presupuesto',
  ACTIVITY_COLUMN: 'Actividad',
  READING_COLUMN: 'Lectura',
  SEPARATOR: ' · ',
} as const;

interface ActivityQuadrantTableProps {
  points: readonly QuadrantPoint[];
}

/**
 * Accessible equivalent of the quadrant: a bubble tells a screen reader nothing, so the
 * same coordinates are exposed as a visually hidden table — the two indices, the budget
 * that sizes the bubble and the reading of both traffic lights in words.
 */
export function ActivityQuadrantTable({ points }: ActivityQuadrantTableProps) {
  return (
    <table className="sr-only">
      <caption>{COPY.CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col">{COPY.ACTIVITY_COLUMN}</th>
          <th scope="col">{INDICATORS.COST_PERFORMANCE_INDEX.acronym}</th>
          <th scope="col">{INDICATORS.SCHEDULE_PERFORMANCE_INDEX.acronym}</th>
          <th scope="col">{INDICATORS.BUDGET_AT_COMPLETION.acronym}</th>
          <th scope="col">{COPY.READING_COLUMN}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.id}>
            <th scope="row">{point.name}</th>
            <td>{formatIndex(point.costPerformanceIndex)}</td>
            <td>{formatIndex(point.schedulePerformanceIndex)}</td>
            <td>{formatMoney(point.budgetAtCompletion)}</td>
            <td>{`${point.costStatusLabel}${COPY.SEPARATOR}${point.scheduleStatusLabel}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

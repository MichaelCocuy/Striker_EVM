import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { formatIndex, formatMoney, formatPercent } from '@/lib/format';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ActivitiesTableProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  projectId: string;
  /** Activities with their indicators, as the report returns them. */
  activities: readonly EvmActivityReport[];
  isLoading: boolean;
  /**
   * Called after a successful create, edit or delete so the dashboard refetches the report.
   * The table never recalculates an indicator locally.
   */
  onDataChanged: () => void;
  className?: string;
}

const COPY = {
  EYEBROW: 'Detalle',
  TITLE: 'Actividades',
  DESCRIPTION: 'Avance planificado y real, costo registrado e indicadores por actividad.',
  EMPTY: 'Este proyecto todavía no tiene actividades.',
  COLUMNS: {
    NAME: 'Actividad',
    OWNER: 'Responsable',
    PLANNED_PROGRESS: '% plan',
    ACTUAL_PROGRESS: '% real',
    BUDGET: 'BAC',
    PLANNED_VALUE: 'PV',
    EARNED_VALUE: 'EV',
    ACTUAL_COST: 'AC',
    CPI: 'CPI',
    SPI: 'SPI',
    STATUS: 'Estado',
  },
} as const;

const SKELETON_LINES = 6;

/**
 * Activities table and, in module M8, the create/edit/delete forms.
 *
 * Contract: `onDataChanged` is the only way this component affects the rest of the dashboard.
 */
export function ActivitiesTable({
  projectId,
  activities,
  isLoading,
  onDataChanged,
  className = '',
  ...rest
}: ActivitiesTableProps) {
  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : activities.length === 0 ? (
        <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.NAME}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.OWNER}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.PLANNED_PROGRESS}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.ACTUAL_PROGRESS}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.BUDGET}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.PLANNED_VALUE}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.EARNED_VALUE}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.ACTUAL_COST}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.CPI}
                </th>
                <th scope="col" className="py-2 pr-4">
                  {COPY.COLUMNS.SPI}
                </th>
                <th scope="col" className="py-2">
                  {COPY.COLUMNS.STATUS}
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-t border-line">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-ink">
                    {activity.name}
                  </th>
                  <td className="py-3 pr-4 text-ink-muted">{activity.owner.fullName}</td>
                  <td className="numeric py-3 pr-4">
                    {formatPercent(activity.input.plannedProgressPercent)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatPercent(activity.input.actualProgressPercent)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatMoney(activity.indicators.budgetAtCompletion)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatMoney(activity.indicators.plannedValue)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatMoney(activity.indicators.earnedValue)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatMoney(activity.indicators.actualCost)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatIndex(activity.indicators.costPerformanceIndex)}
                  </td>
                  <td className="numeric py-3 pr-4">
                    {formatIndex(activity.indicators.schedulePerformanceIndex)}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        tone={costStatusTone(activity.indicators.costStatus)}
                        label={COST_STATUS_LABEL[activity.indicators.costStatus]}
                      />
                      <StatusPill
                        tone={scheduleStatusTone(activity.indicators.scheduleStatus)}
                        label={SCHEDULE_STATUS_LABEL[activity.indicators.scheduleStatus]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

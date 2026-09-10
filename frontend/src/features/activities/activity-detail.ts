import { COST_STATUS } from '@/api/types';
import { formatIndex, formatMoney } from '@/lib/format';

import type { EvmActivityReport } from '@/api/types';

export const ACTIVITY_DETAIL_COPY = {
  BACK: 'Volver al tablero',
  EYEBROW: 'Actividad',
  SEPARATOR: ' · ',
  OWNER: 'Responsable:',
  BUDGET_LABEL: 'BAC',
  READING: {
    EYEBROW: 'Lectura',
    TITLE: 'Avance y costo a la fecha',
  },
  INDICATORS: {
    EYEBROW: 'Indicadores',
    TITLE: 'Todos los indicadores del reporte',
    DESCRIPTION:
      'Las cifras que el reporte devuelve para esta actividad. Un indicador no calculable se muestra como «—», nunca como cero.',
    NOTES_TITLE: 'Notas del cálculo',
  },
  ACTIONS: {
    REGISTER: 'Registrar avance',
    EDIT: 'Editar',
    DELETE: 'Eliminar',
  },
  MISSING: 'No encontramos esta actividad en el reporte del proyecto.',
} as const;

const ALERT_COPY = {
  TITLE: 'Esta actividad terminará por encima de su presupuesto',
  body: (values: {
    costIndex: string;
    scheduleIndex: string;
    estimate: string;
    overrun: string;
    budget: string;
  }) =>
    `Con CPI ${values.costIndex} y SPI ${values.scheduleIndex}, terminará en ${values.estimate}: ${values.overrun} por encima de su presupuesto de ${values.budget}.`,
} as const;

export interface ActivityAlertReading {
  title: string;
  body: string;
}

/**
 * The red block of the detail, only when the activity is heading over its own budget.
 *
 * Every figure it quotes — CPI, SPI, EAC, VAC and BAC — comes from the report; the decision to
 * show it reads `costStatus`, which the report also sends. The prototype's wording claims the
 * activity explains *the whole* deviation of the project, which would need a comparison the
 * contract does not authorise, so the sentence talks about this activity only.
 */
export function activityAlert({ indicators }: EvmActivityReport): ActivityAlertReading | null {
  const { costStatus, estimateAtCompletion, varianceAtCompletion } = indicators;
  const isOverBudget = costStatus === COST_STATUS.OVER_BUDGET;
  if (
    !isOverBudget ||
    estimateAtCompletion === null ||
    varianceAtCompletion === null ||
    varianceAtCompletion >= 0
  ) {
    return null;
  }
  return {
    title: ALERT_COPY.TITLE,
    body: ALERT_COPY.body({
      costIndex: formatIndex(indicators.costPerformanceIndex),
      scheduleIndex: formatIndex(indicators.schedulePerformanceIndex),
      estimate: formatMoney(estimateAtCompletion),
      overrun: formatMoney(Math.abs(varianceAtCompletion)),
      budget: formatMoney(indicators.budgetAtCompletion),
    }),
  };
}

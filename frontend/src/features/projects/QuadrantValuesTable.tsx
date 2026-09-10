import { COST_STATUS_LABEL, SCHEDULE_STATUS_LABEL } from '@/evm/tone';
import { formatIndex, formatMoney, NOT_COMPUTABLE } from '@/lib/format';

import { PORTFOLIO_COPY } from './portfolio-copy';

import type { PortfolioItem } from './portfolio-items';

/**
 * The quadrant's figures as text. A chart is a graphic, so every number it draws — and every
 * number it cannot draw, such as the project without activities — is also available here for
 * assistive technology, visually hidden.
 */

const CELL_CLASSES = 'numeric';

interface QuadrantValuesTableProps {
  items: readonly PortfolioItem[];
}

export function QuadrantValuesTable({ items }: QuadrantValuesTableProps) {
  const { TABLE } = PORTFOLIO_COPY.QUADRANT;

  return (
    <table className="sr-only">
      <caption>{TABLE.CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col">{TABLE.NUMBER}</th>
          <th scope="col">{TABLE.PROJECT}</th>
          <th scope="col">{TABLE.CPI}</th>
          <th scope="col">{TABLE.SPI}</th>
          <th scope="col">{TABLE.BUDGET}</th>
          <th scope="col">{TABLE.COST_STATUS}</th>
          <th scope="col">{TABLE.SCHEDULE_STATUS}</th>
        </tr>
      </thead>
      <tbody>
        {items.map(({ number, entry }) => {
          const { indicators } = entry;
          return (
            <tr key={entry.project.id}>
              <th scope="row">{number}</th>
              <td>{entry.project.name}</td>
              <td className={CELL_CLASSES}>
                {formatIndex(indicators?.costPerformanceIndex ?? null)}
              </td>
              <td className={CELL_CLASSES}>
                {formatIndex(indicators?.schedulePerformanceIndex ?? null)}
              </td>
              <td className={CELL_CLASSES}>
                {indicators === null ? NOT_COMPUTABLE : formatMoney(indicators.budgetAtCompletion)}
              </td>
              <td>
                {indicators === null
                  ? PORTFOLIO_COPY.LIST.STATUS_UNAVAILABLE
                  : COST_STATUS_LABEL[indicators.costStatus]}
              </td>
              <td>
                {indicators === null
                  ? PORTFOLIO_COPY.LIST.STATUS_UNAVAILABLE
                  : SCHEDULE_STATUS_LABEL[indicators.scheduleStatus]}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

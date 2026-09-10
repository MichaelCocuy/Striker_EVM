import { formatMoney } from '@/lib/format';

import type { BridgeColumn } from './bridge-rows';

const COPY = {
  CAPTION: 'Puente de varianzas: de lo planificado a lo gastado',
  COLUMNS: {
    INDICATOR: 'Indicador',
    AMOUNT: 'Monto',
    READING: 'Lectura',
    MEANING: 'Qué mide',
  },
} as const;

interface BridgeValuesTableProps {
  columns: readonly BridgeColumn[];
}

/**
 * Accessible equivalent of the bridge: the five columns as a visually hidden table, each
 * with its amount, the reading of its sign and what the indicator measures.
 */
export function BridgeValuesTable({ columns }: BridgeValuesTableProps) {
  return (
    <table className="sr-only">
      <caption>{COPY.CAPTION}</caption>
      <thead>
        <tr>
          <th scope="col">{COPY.COLUMNS.INDICATOR}</th>
          <th scope="col">{COPY.COLUMNS.AMOUNT}</th>
          <th scope="col">{COPY.COLUMNS.READING}</th>
          <th scope="col">{COPY.COLUMNS.MEANING}</th>
        </tr>
      </thead>
      <tbody>
        {columns.map((column) => (
          <tr key={column.meta.acronym}>
            <th scope="row">{`${column.meta.acronym} — ${column.meta.name}`}</th>
            <td>{formatMoney(column.value)}</td>
            <td>{column.gloss}</td>
            <td>{column.meta.help}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

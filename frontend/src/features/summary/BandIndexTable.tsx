import { COST_STATUS_LABEL, SCHEDULE_STATUS_LABEL } from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { formatIndex } from '@/lib/format';

import { BAND_COPY } from './band-copy';

import type { EvmIndicators } from '@/api/types';
import type { IndicatorMeta } from '@/features/evm-report/indicator-copy';

const COLUMNS = {
  INDICATOR: 'Indicador',
  VALUE: 'Valor',
  READING: 'Lectura',
  MEANING: 'Qué mide',
} as const;

interface IndexRow {
  meta: IndicatorMeta;
  value: number | null;
  statusLabel: string;
}

interface BandIndexTableProps {
  indicators: EvmIndicators;
}

/**
 * Accessible equivalent of the two gauges: an SVG arc says nothing to a screen reader, so
 * CPI and SPI are also exposed as a visually hidden table with their value, the reading the
 * report brings and what each index measures.
 */
export function BandIndexTable({ indicators }: BandIndexTableProps) {
  const rows: IndexRow[] = [
    {
      meta: INDICATORS.COST_PERFORMANCE_INDEX,
      value: indicators.costPerformanceIndex,
      statusLabel: COST_STATUS_LABEL[indicators.costStatus],
    },
    {
      meta: INDICATORS.SCHEDULE_PERFORMANCE_INDEX,
      value: indicators.schedulePerformanceIndex,
      statusLabel: SCHEDULE_STATUS_LABEL[indicators.scheduleStatus],
    },
  ];

  return (
    <table className="sr-only">
      <caption>{BAND_COPY.INDICATORS_LABEL}</caption>
      <thead>
        <tr>
          <th scope="col">{COLUMNS.INDICATOR}</th>
          <th scope="col">{COLUMNS.VALUE}</th>
          <th scope="col">{COLUMNS.READING}</th>
          <th scope="col">{COLUMNS.MEANING}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.meta.acronym}>
            <th scope="row">{`${row.meta.acronym} — ${row.meta.name}`}</th>
            <td>{formatIndex(row.value)}</td>
            <td>{row.statusLabel}</td>
            <td>{row.meta.help}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

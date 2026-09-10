import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import { formatIndex } from '@/lib/format';
import {
  STATUS_COLOR_VARIABLE,
  STATUS_SOFT_COLOR_VARIABLE,
  useStatusColorTween,
} from '@/motion/useStatusColorTween';

import { indexStatusReading, INDEX_CHIP_SIZE } from './activity-index';

import type { ActivityIndexDescriptor, IndexChipSize } from './activity-index';
import type { EvmIndicators } from '@/api/types';

interface ActivityIndexChipProps {
  index: ActivityIndexDescriptor;
  indicators: EvmIndicators;
  size?: IndexChipSize;
  /** Prefixes the chip with the name of the index, where no column header carries it. */
  withName?: boolean;
}

/**
 * An index inside its traffic-light chip: the four decimals of EVM_GUIA §7 when it is
 * computable, the em dash and the "no aplica" tone when it is not.
 *
 * The interpretation stays readable as text next to the number, which on its own only says
 * "0,8000": the traffic light never communicates by colour alone.
 */
export function ActivityIndexChip({
  index,
  indicators,
  size = INDEX_CHIP_SIZE.ROW,
  withName = false,
}: ActivityIndexChipProps) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const { tone, label } = indexStatusReading(indicators, index.statusKey);
  useStatusColorTween(chipRef, EVM_TONE_TOKENS[tone]);
  const value = formatIndex(indicators[index.key]);

  return (
    <span className="inline-flex items-center">
      <span
        ref={chipRef}
        data-tone={tone}
        className={`inline-flex items-center rounded-pill px-2.5 py-1 font-heading font-bold tabular-nums ${size}`}
        style={{
          backgroundColor: `var(${STATUS_SOFT_COLOR_VARIABLE})`,
          color: `var(${STATUS_COLOR_VARIABLE})`,
        }}
      >
        {withName ? `${index.label} ${value}` : value}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

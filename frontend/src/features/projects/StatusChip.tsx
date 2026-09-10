import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import {
  STATUS_COLOR_VARIABLE,
  STATUS_SOFT_COLOR_VARIABLE,
  useStatusColorTween,
} from '@/motion/useStatusColorTween';

import type { EvmTone } from '@/evm/tone';

/**
 * Dense traffic-light chip of the portfolio list: Poppins 600 at 10,5 px, soft background and
 * the ink of its tone, as the handoff draws the chips of a row.
 *
 * It is the compact sibling of `components/ui/StatusPill`, which is sized for a card and too
 * heavy for a list row. Same tokens, same colour cross-fade; only the geometry differs, so it
 * belongs in the kit as a size of `StatusPill` once both land.
 */

const CHIP_CLASSES =
  'inline-flex items-center rounded-pill px-[9px] py-[3px] font-heading text-[10.5px] font-semibold tracking-[0.4px]';

interface StatusChipProps {
  tone: EvmTone;
  label: string;
}

export function StatusChip({ tone, label }: StatusChipProps) {
  const chipRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(chipRef, EVM_TONE_TOKENS[tone]);

  return (
    <span
      ref={chipRef}
      data-tone={tone}
      className={CHIP_CLASSES}
      style={{
        backgroundColor: `var(${STATUS_SOFT_COLOR_VARIABLE})`,
        color: `var(${STATUS_COLOR_VARIABLE})`,
      }}
    >
      {label}
    </span>
  );
}

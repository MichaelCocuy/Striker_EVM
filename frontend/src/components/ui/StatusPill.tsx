import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import {
  STATUS_COLOR_VARIABLE,
  STATUS_SOFT_COLOR_VARIABLE,
  useStatusColorTween,
} from '@/motion/useStatusColorTween';

import { STATUS_PILL_SIZE } from './status-pill-sizes';

import type { StatusPillSize } from './status-pill-sizes';
import type { EvmTone } from '@/evm/tone';

interface StatusPillProps {
  tone: EvmTone;
  label: string;
  size?: StatusPillSize;
}

const BASE_CLASSES = 'inline-flex items-center rounded-pill font-heading font-semibold';

const SIZE_CLASSES: Record<StatusPillSize, string> = {
  [STATUS_PILL_SIZE.MD]: 'gap-2 px-3 py-1 text-caption',
  [STATUS_PILL_SIZE.SM]: 'px-[9px] py-[3px] text-[10.5px] tracking-[0.4px]',
};

/** The dot is what the row has no space for, so only the card-sized chip carries it. */
const SIZES_WITH_DOT: readonly StatusPillSize[] = [STATUS_PILL_SIZE.MD];

/**
 * Traffic-light chip whose colors cross-fade when the tone changes.
 *
 * The label always travels with the tone — the handoff forbids the traffic light
 * communicating by colour alone — which is why the dot is the part the compact size drops.
 */
export function StatusPill({ tone, label, size = STATUS_PILL_SIZE.MD }: StatusPillProps) {
  const pillRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(pillRef, EVM_TONE_TOKENS[tone]);

  return (
    <span
      ref={pillRef}
      data-tone={tone}
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]}`}
      style={{
        backgroundColor: `var(${STATUS_SOFT_COLOR_VARIABLE})`,
        color: `var(${STATUS_COLOR_VARIABLE})`,
      }}
    >
      {SIZES_WITH_DOT.includes(size) && (
        <span
          aria-hidden="true"
          className="size-2 rounded-pill"
          style={{ backgroundColor: `var(${STATUS_COLOR_VARIABLE})` }}
        />
      )}
      {label}
    </span>
  );
}

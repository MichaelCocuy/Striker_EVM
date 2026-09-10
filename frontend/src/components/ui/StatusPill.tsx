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
  /**
   * What the traffic light means, for assistive technology only. It is what the figure sizes
   * need: «0,8000» does not say «sobre presupuesto», so the reading travels beside it.
   */
  description?: string;
}

const BASE_CLASSES = 'inline-flex items-center rounded-pill font-heading';

const SIZE_CLASSES: Record<StatusPillSize, string> = {
  [STATUS_PILL_SIZE.MD]: 'gap-2 px-3 py-1 font-semibold text-caption',
  [STATUS_PILL_SIZE.SM]: 'px-[9px] py-[3px] font-semibold text-[10.5px] tracking-[0.4px]',
  [STATUS_PILL_SIZE.FIGURE]: 'px-2.5 py-1 font-bold tabular-nums text-caption',
  [STATUS_PILL_SIZE.FIGURE_SM]: 'px-2.5 py-1 font-bold tabular-nums text-badge',
};

/** The dot is what the row has no space for, so only the card-sized chip carries it. */
const SIZES_WITH_DOT: readonly StatusPillSize[] = [STATUS_PILL_SIZE.MD];

/**
 * Traffic-light chip whose colors cross-fade when the tone changes.
 *
 * The label always travels with the tone — the handoff forbids the traffic light
 * communicating by colour alone — which is why the dot is the part the compact size drops.
 * Where the label is a figure rather than the status in words, `description` carries the
 * reading for whoever cannot see the colour.
 */
export function StatusPill({
  tone,
  label,
  size = STATUS_PILL_SIZE.MD,
  description,
}: StatusPillProps) {
  const pillRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(pillRef, EVM_TONE_TOKENS[tone]);

  const pill = (
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

  if (description === undefined) {
    return pill;
  }

  return (
    <span className="inline-flex items-center">
      {pill}
      <span className="sr-only">{description}</span>
    </span>
  );
}

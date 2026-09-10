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
  [STATUS_PILL_SIZE.SM]: 'gap-1.5 px-2 py-0.5 text-badge tracking-label uppercase',
};

const DOT_SIZE_CLASSES: Record<StatusPillSize, string> = {
  [STATUS_PILL_SIZE.MD]: 'size-2',
  [STATUS_PILL_SIZE.SM]: 'size-1.5',
};

/**
 * Traffic-light chip whose colors cross-fade when the tone changes.
 *
 * The label always travels with the dot: the handoff forbids the traffic light communicating
 * by colour alone.
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
      <span
        aria-hidden="true"
        className={`rounded-pill ${DOT_SIZE_CLASSES[size]}`}
        style={{ backgroundColor: `var(${STATUS_COLOR_VARIABLE})` }}
      />
      {label}
    </span>
  );
}

import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import {
  STATUS_COLOR_VARIABLE,
  STATUS_SOFT_COLOR_VARIABLE,
  useStatusColorTween,
} from '@/motion/useStatusColorTween';

import type { EvmTone } from '@/evm/tone';

interface StatusPillProps {
  tone: EvmTone;
  label: string;
}

/** Traffic-light chip whose colors cross-fade when the tone changes. */
export function StatusPill({ tone, label }: StatusPillProps) {
  const pillRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(pillRef, EVM_TONE_TOKENS[tone]);

  return (
    <span
      ref={pillRef}
      data-tone={tone}
      className="inline-flex items-center gap-2 rounded-pill px-3 py-1 text-sm font-semibold"
      style={{
        backgroundColor: `var(${STATUS_SOFT_COLOR_VARIABLE})`,
        color: `var(${STATUS_COLOR_VARIABLE})`,
      }}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-pill"
        style={{ backgroundColor: `var(${STATUS_COLOR_VARIABLE})` }}
      />
      {label}
    </span>
  );
}

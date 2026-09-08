import { useRef } from 'react';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { StatusPill } from '@/components/ui/StatusPill';
import { EVM_TONE_TOKENS } from '@/evm/tone';
import { STATUS_COLOR_VARIABLE, useStatusColorTween } from '@/motion/useStatusColorTween';

import { FIGURE_SIZE, FIGURE_SIZE_CLASS } from './figure-size';

import type { FigureSize } from './figure-size';
import type { EvmTone } from '@/evm/tone';

interface StatusFigureProps {
  value: number | null;
  decimals: number;
  tone: EvmTone;
  /** How the figure reads: the label of the traffic light it belongs to. */
  reading: string;
  size?: FigureSize;
}

/**
 * A reported figure painted with its traffic-light color next to the label that interprets
 * it. The color cross-fades when the tone changes instead of blinking.
 */
export function StatusFigure({
  value,
  decimals,
  tone,
  reading,
  size = FIGURE_SIZE.COMPACT,
}: StatusFigureProps) {
  const figureRef = useRef<HTMLDivElement>(null);
  useStatusColorTween(figureRef, EVM_TONE_TOKENS[tone]);

  return (
    <div
      ref={figureRef}
      data-tone={tone}
      className="flex flex-wrap items-center gap-3"
      style={{ color: `var(${STATUS_COLOR_VARIABLE})` }}
    >
      <AnimatedNumber value={value} decimals={decimals} className={FIGURE_SIZE_CLASS[size]} />
      <StatusPill tone={tone} label={reading} />
    </div>
  );
}

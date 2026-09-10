import { EVM_TONE } from '@/evm/tone';

import { IndicatorTile } from './IndicatorTile';

import type { IndicatorMeta } from './summary-copy';
import type { EvmTone } from '@/evm/tone';
import type { ReactNode } from 'react';

/** Accent edge that gives the tile the traffic-light color of the status it answers with. */
const TONE_ACCENT_CLASS: Record<EvmTone, string> = {
  [EVM_TONE.GOOD]: 'border-l-4 border-l-evm-good',
  [EVM_TONE.NEUTRAL]: 'border-l-4 border-l-evm-neutral',
  [EVM_TONE.BAD]: 'border-l-4 border-l-evm-bad',
  [EVM_TONE.NA]: 'border-l-4 border-l-evm-na',
};

interface VerdictAnswerTileProps {
  /** The question a project lead asks, which this tile answers. */
  question: string;
  /** The indicator that answers it: acronym, Spanish name and what it means. */
  meta: IndicatorMeta;
  tone: EvmTone;
  /** The figure of the indicator and the money that backs it. */
  children: ReactNode;
}

/** One of the three answers of the band, headed by its question and toned by its status. */
export function VerdictAnswerTile({ question, meta, tone, children }: VerdictAnswerTileProps) {
  return (
    <IndicatorTile question={question} meta={meta} className={TONE_ACCENT_CLASS[tone]}>
      {children}
    </IndicatorTile>
  );
}

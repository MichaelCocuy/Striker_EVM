import { useRef } from 'react';

import { StatusPill } from '@/components/ui/StatusPill';
import { EVM_TONE_TOKENS } from '@/evm/tone';
import {
  STATUS_COLOR_VARIABLE,
  STATUS_SOFT_COLOR_VARIABLE,
  useStatusColorTween,
} from '@/motion/useStatusColorTween';

import { SUMMARY_REVEAL_ATTRIBUTE } from './summary-motion';

import type { EvmTone } from '@/evm/tone';

interface VerdictBannerProps {
  /** Tone of the whole band, so good/warning/bad registers before the sentence is read. */
  tone: EvmTone;
  /** How the verdict reads in two words ("Va mal"), next to the sentence that says why. */
  badge: string;
  headline: string;
  detail: string;
}

/**
 * The answer of the band: a tinted strip in the tone of the project, the verdict in one
 * sentence as the largest thing on screen and its consequence underneath.
 *
 * The tint cross-fades with the tone instead of blinking when the report is recalculated.
 */
export function VerdictBanner({ tone, badge, headline, detail }: VerdictBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  useStatusColorTween(bannerRef, EVM_TONE_TOKENS[tone]);

  return (
    <div
      {...{ [SUMMARY_REVEAL_ATTRIBUTE]: true }}
      ref={bannerRef}
      data-tone={tone}
      className="flex overflow-hidden rounded-lg border border-line"
      style={{ backgroundColor: `var(${STATUS_SOFT_COLOR_VARIABLE})` }}
    >
      <span
        aria-hidden="true"
        className="w-1.5 shrink-0"
        style={{ backgroundColor: `var(${STATUS_COLOR_VARIABLE})` }}
      />
      <div className="flex flex-col items-start gap-3 p-5">
        <StatusPill tone={tone} label={badge} />
        <p className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {headline}
        </p>
        <p className="numeric text-base text-ink-muted">{detail}</p>
      </div>
    </div>
  );
}

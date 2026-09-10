import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import { STATUS_COLOR_VARIABLE, useStatusColorTween } from '@/motion/useStatusColorTween';

import { indexStatusReading } from './activity-index';
import { indicatorValue } from './activity-indicators';

import type { IndicatorDescriptor } from './activity-indicators';
import type { EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';
import type { ReactNode } from 'react';

interface TonedFigureProps {
  tone: EvmTone;
  children: ReactNode;
}

/** A figure that wears the tint of its traffic light and cross-fades when the tone changes. */
function TonedFigure({ tone, children }: TonedFigureProps) {
  const figureRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(figureRef, EVM_TONE_TOKENS[tone]);

  return (
    <span
      ref={figureRef}
      data-tone={tone}
      className="numeric text-figure-xs"
      style={{ color: `var(${STATUS_COLOR_VARIABLE})` }}
    >
      {children}
    </span>
  );
}

interface ActivityFigureTileProps {
  /** Short name of the indicator, as the overline of the tile. */
  label: string;
  /** Already formatted by `lib/format`, so `null` arrives as the em dash and never as zero. */
  value: string;
  /** Tone of the traffic light the report brings for it, when the figure carries one. */
  tone?: EvmTone;
  /** The interpretation of that traffic light, so the tint never communicates alone. */
  toneLabel?: string;
}

/** One reported figure on the sunken plane of a card: overline plus number. */
export function ActivityFigureTile({ label, value, tone, toneLabel }: ActivityFigureTileProps) {
  return (
    <div className="rounded-md bg-canvas p-3">
      <p className="font-heading text-badge font-bold uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      {tone === undefined ? (
        <span className="numeric text-figure-xs text-ink">{value}</span>
      ) : (
        <TonedFigure tone={tone}>{value}</TonedFigure>
      )}
      {toneLabel !== undefined && <span className="sr-only">{toneLabel}</span>}
    </div>
  );
}

interface ActivityIndicatorTileProps {
  indicator: IndicatorDescriptor;
  indicators: EvmIndicators;
}

/** The tile of one reported indicator, toned when the report brings a traffic light for it. */
export function ActivityIndicatorTile({ indicator, indicators }: ActivityIndicatorTileProps) {
  const reading =
    indicator.statusKey === undefined ? null : indexStatusReading(indicators, indicator.statusKey);

  return (
    <ActivityFigureTile
      label={indicator.label}
      value={indicatorValue(indicator, indicators)}
      {...(reading === null ? {} : { tone: reading.tone, toneLabel: reading.label })}
    />
  );
}

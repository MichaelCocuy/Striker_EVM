import { CHIP_TONE } from './chip-tones';

import type { ChipTone } from './chip-tones';
import type { ReactNode } from 'react';

interface ChipProps {
  tone?: ChipTone;
  children: ReactNode;
}

const BASE_CLASSES =
  'inline-flex items-center gap-1.5 rounded-pill px-3.5 py-[7px] font-heading text-[11px] font-semibold tracking-[1.2px] uppercase';

const TONE_CLASSES: Record<ChipTone, string> = {
  [CHIP_TONE.SUBTLE]: 'bg-surface-sunken text-ink-muted',
  [CHIP_TONE.ACCENT]: 'bg-accent-soft text-accent',
  [CHIP_TONE.BRAND_ON_NAVY]: 'bg-[var(--tc-chip-brand-bg)] text-[var(--tc-chip-brand-ink)]',
  [CHIP_TONE.OUTLINE_ON_NAVY]: 'border-[1.5px] border-white/35 text-white/80',
};

/** Pill-shaped label: a claim, a tag, a flag. Never interactive — that is a Button. */
export function Chip({ tone = CHIP_TONE.SUBTLE, children }: ChipProps) {
  return <span className={`${BASE_CLASSES} ${TONE_CLASSES[tone]}`}>{children}</span>;
}

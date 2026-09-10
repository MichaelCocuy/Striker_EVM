import { BRAND_MARK_TONE, BRAND_MARK_VARIANT, BRAND_TILE_SIZE } from './brand-variants';
import { BrandTile } from './BrandTile';

import type { BrandMarkTone, BrandMarkVariant, BrandTileSize } from './brand-variants';

export const APP_NAME = 'Striker EVM';

interface BrandMarkProps {
  /** Hide the wordmark when space is tight (collapsed sidebar, favicon-like usage). */
  compact?: boolean;
  variant?: BrandMarkVariant;
  tone?: BrandMarkTone;
  size?: BrandTileSize;
}

const COPY = {
  DISCIPLINE: 'Valor ganado',
  COMPANY: 'trycore',
} as const;

const NAME_TONE_CLASSES: Record<BrandMarkTone, string> = {
  [BRAND_MARK_TONE.INK]: 'text-ink',
  [BRAND_MARK_TONE.ON_NAVY]: 'text-white',
};

const DISCIPLINE_TONE_CLASSES: Record<BrandMarkTone, string> = {
  [BRAND_MARK_TONE.INK]: 'text-ink-subtle',
  [BRAND_MARK_TONE.ON_NAVY]: 'text-white/50',
};

const COMPANY_TONE_CLASSES: Record<BrandMarkTone, string> = {
  [BRAND_MARK_TONE.INK]: 'border-line text-accent',
  [BRAND_MARK_TONE.ON_NAVY]: 'border-white/18 text-accent-on-navy/75',
};

/** Brand tile plus wordmark, in the two arrangements the redesign uses. */
export function BrandMark({
  compact = false,
  variant = BRAND_MARK_VARIANT.STACKED,
  tone = BRAND_MARK_TONE.INK,
  size = BRAND_TILE_SIZE.SM,
}: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandTile size={size} />
      {!compact &&
        (variant === BRAND_MARK_VARIANT.WORDMARK ? (
          <Wordmark tone={tone} />
        ) : (
          <Stacked tone={tone} />
        ))}
    </span>
  );
}

interface BrandMarkToneProps {
  tone: BrandMarkTone;
}

function Stacked({ tone }: BrandMarkToneProps) {
  return (
    <span className="flex flex-col">
      <span
        className={`font-heading text-[14px] leading-tight font-bold ${NAME_TONE_CLASSES[tone]}`}
      >
        {APP_NAME}
      </span>
      <span
        className={`mt-0.5 text-badge tracking-label uppercase ${DISCIPLINE_TONE_CLASSES[tone]}`}
      >
        {COPY.DISCIPLINE}
      </span>
    </span>
  );
}

function Wordmark({ tone }: BrandMarkToneProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`font-heading text-[15px] font-bold tracking-tight ${NAME_TONE_CLASSES[tone]}`}
      >
        {APP_NAME}
      </span>
      <span className={`border-l pl-3 text-small ${COMPANY_TONE_CLASSES[tone]}`}>
        {COPY.COMPANY}
      </span>
    </span>
  );
}

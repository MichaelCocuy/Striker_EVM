import symbolTrycore from '@/assets/brand/symbol-trycore.svg';

import { BRAND_TILE_SIZE } from './brand-variants';

import type { BrandTileSize } from './brand-variants';

interface BrandTileProps {
  size?: BrandTileSize;
}

const BASE_CLASSES =
  'grid shrink-0 place-items-center rounded-lg bg-[image:var(--tc-grad-brand)] shadow-glow-brand';

const SIZE_CLASSES: Record<BrandTileSize, string> = {
  [BRAND_TILE_SIZE.SM]: 'size-[34px] p-1.5',
  [BRAND_TILE_SIZE.MD]: 'size-10 p-[7px]',
};

/**
 * The brand tile: the Trycore orbital symbol on the brand gradient, with its teal halo.
 *
 * The symbol ships in its own two inks, so it is knocked out to white with the filter the
 * handoff prescribes rather than duplicated as a second asset.
 */
export function BrandTile({ size = BRAND_TILE_SIZE.SM }: BrandTileProps) {
  return (
    <span aria-hidden="true" className={`${BASE_CLASSES} ${SIZE_CLASSES[size]}`}>
      <img
        src={symbolTrycore}
        alt=""
        className="size-full [filter:brightness(0)_invert(1)]"
        draggable={false}
      />
    </span>
  );
}

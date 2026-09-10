import type { ReactNode } from 'react';

/**
 * The three Lucide line icons the portfolio needs: the row's navigation affordance and the
 * reviewer's two management actions.
 *
 * Lucide, line only, `currentColor`, stroke 1.6 as the handoff's iconography section requires.
 * They live here because the kit has no icon module yet; they are candidates for it.
 */

const ICON = {
  VIEWBOX: '0 0 24 24',
  SIZE_PX: 18,
  ACTION_SIZE_PX: 16,
  STROKE_WIDTH: 1.6,
} as const;

interface LineIconProps {
  size: number;
  className?: string;
  children: ReactNode;
}

function LineIcon({ size, className = '', children }: LineIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={ICON.VIEWBOX}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON.STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

interface IconProps {
  className?: string;
}

/** `arrow-right`: the affordance that says the whole row opens the project. */
export function ArrowRightIcon({ className = '' }: IconProps) {
  return (
    <LineIcon size={ICON.SIZE_PX} className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </LineIcon>
  );
}

/** `pencil`: edit the project. */
export function PencilIcon({ className = '' }: IconProps) {
  return (
    <LineIcon size={ICON.ACTION_SIZE_PX} className={className}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </LineIcon>
  );
}

/** `trash-2`: delete the project. */
export function TrashIcon({ className = '' }: IconProps) {
  return (
    <LineIcon size={ICON.ACTION_SIZE_PX} className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </LineIcon>
  );
}

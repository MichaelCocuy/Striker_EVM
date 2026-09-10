import { formatMoney, MONEY_DECIMALS } from '@/lib/format';
import { useCountUp } from '@/motion/useCountUp';

/** Money on the band: 24px Poppins with tabular digits, in the ink the caller chooses. */
const FIGURE_CLASS = 'numeric text-figure-md';

interface BandFigureProps {
  /** Money as the report brings it; `null` renders the not-computable mark, never zero. */
  value: number | null;
  /** Resolved ink of the figure, from the band's own palette. */
  color: string;
}

/**
 * A figure of the reading band, counting up towards its new value. It is real text, so the
 * number reaches a screen reader exactly as it is written on screen.
 */
export function BandFigure({ value, color }: BandFigureProps) {
  const displayValue = useCountUp(value, { decimals: MONEY_DECIMALS });

  return (
    <p className={FIGURE_CLASS} style={{ color }}>
      {formatMoney(displayValue)}
    </p>
  );
}

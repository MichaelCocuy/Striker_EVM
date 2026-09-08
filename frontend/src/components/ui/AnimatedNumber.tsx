import { formatNumber } from '@/lib/format';
import { useCountUp } from '@/motion/useCountUp';

const NOT_AVAILABLE_SYMBOL = '—';

interface AnimatedNumberProps {
  value: number | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Large indicator numeral that counts towards its new value; `null` renders an em dash. */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const displayValue = useCountUp(value, { decimals });

  return (
    <span
      className={`numeric ${className}`}
      aria-label={value === null ? undefined : String(value)}
    >
      {displayValue === null
        ? NOT_AVAILABLE_SYMBOL
        : `${prefix}${formatNumber(displayValue, decimals)}${suffix}`}
    </span>
  );
}

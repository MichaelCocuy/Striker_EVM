import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

const COPY = {
  EYEBROW: 'Índices',
  TITLE: 'CPI y SPI',
  DESCRIPTION: 'Velocímetros con la aguja apuntando a 1.0 como referencia.',
} as const;

const GAUGE_LABELS = ['CPI', 'SPI'] as const;

/** Slot for module M10 (gauges). */
export function GaugePlaceholder() {
  return (
    <PlaceholderCard
      {...{ [REVEAL_ATTRIBUTE]: true }}
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
    >
      <div className="grid grid-cols-2 gap-4" aria-hidden="true">
        {GAUGE_LABELS.map((label) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-full rounded-t-pill" />
            <span className="eyebrow">{label}</span>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  );
}

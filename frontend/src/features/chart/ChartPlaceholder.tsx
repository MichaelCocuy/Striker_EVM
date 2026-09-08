import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

const COPY = {
  EYEBROW: 'Gráficas',
  TITLE: 'PV · EV · AC por actividad',
  DESCRIPTION: 'Barras agrupadas por actividad y gauges de CPI y SPI con referencia en 1.0.',
} as const;

const BAR_HEIGHT_CLASSES = ['h-16', 'h-24', 'h-20', 'h-28', 'h-14', 'h-22', 'h-24', 'h-10', 'h-12'];

/** Slot for module M10 (Recharts bars and gauges). */
export function ChartPlaceholder() {
  return (
    <PlaceholderCard
      {...{ [REVEAL_ATTRIBUTE]: true }}
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className="lg:col-span-2"
    >
      <div className="flex h-40 items-end gap-2 border-b border-line pb-px" aria-hidden="true">
        {BAR_HEIGHT_CLASSES.map((heightClass, index) => (
          <Skeleton key={index} className={`${heightClass} w-full rounded-t-sm`} />
        ))}
      </div>
    </PlaceholderCard>
  );
}

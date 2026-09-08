import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

const COPY = {
  EYEBROW: 'Consolidado',
  TITLE: 'Resumen del proyecto',
  DESCRIPTION: 'CPI, SPI, varianzas y pronóstico al cierre con su semáforo.',
} as const;

const KPI_LABELS = ['CPI', 'SPI', 'CV', 'SV', 'EAC', 'VAC'] as const;

/** Slot for module M9 (indicator cards with animated counters). */
export function SummaryPlaceholder() {
  return (
    <PlaceholderCard
      {...{ [REVEAL_ATTRIBUTE]: true }}
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className="lg:col-span-3"
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_LABELS.map((label) => (
          <div key={label} className="flex flex-col gap-2 rounded-md bg-surface-sunken/60 p-4">
            <dt className="eyebrow">{label}</dt>
            <dd className="m-0">
              <Skeleton className="h-9 w-24" />
            </dd>
          </div>
        ))}
      </dl>
    </PlaceholderCard>
  );
}

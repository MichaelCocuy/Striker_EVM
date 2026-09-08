import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

const COPY = {
  EYEBROW: 'Detalle',
  TITLE: 'Actividades',
  DESCRIPTION: 'Datos de entrada e indicadores por actividad, con edición según tu rol.',
} as const;

const TABLE_COLUMNS = ['Actividad', 'Responsable', 'BAC', 'CPI', 'SPI', 'Estado'] as const;
const SKELETON_ROWS = 3;

/** Slot for module M8 (animated activities table and CRUD form). */
export function ActivitiesTablePlaceholder() {
  return (
    <PlaceholderCard
      {...{ [REVEAL_ATTRIBUTE]: true }}
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className="lg:col-span-3"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {TABLE_COLUMNS.map((column) => (
                <th key={column} scope="col" className="eyebrow pb-3 pr-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-line/60">
                {TABLE_COLUMNS.map((column) => (
                  <td key={column} className="py-3.5 pr-4">
                    <Skeleton className="h-3.5 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlaceholderCard>
  );
}

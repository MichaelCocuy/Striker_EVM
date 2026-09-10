import { Skeleton } from '@/components/ui/Skeleton';

import { PORTFOLIO_COPY } from './portfolio-copy';
import { PORTFOLIO_LAYOUT } from './portfolio-layout';

/**
 * Loading state shaped like the content that is coming: four KPI tiles, the plot at its final
 * height so the layout cannot jump, and eight rows — never a centred spinner.
 */

const SKELETON_COUNT = { KPI_TILES: 4, ROWS: 8 } as const;
/** The plot keeps the aspect ratio of the quadrant's viewBox. */
const PLOT_CLASSES = 'aspect-[460/360] w-full';

function KpiTileSkeleton() {
  return (
    <div className={PORTFOLIO_LAYOUT.KPI_TILE}>
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className={`${PORTFOLIO_LAYOUT.ROW} flex items-center gap-3.5`}>
      <Skeleton className="h-3 w-5" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-6 w-14" />
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        {PORTFOLIO_COPY.LOADING}
      </p>
      <div className={PORTFOLIO_LAYOUT.KPI_STRIP} aria-hidden="true">
        {Array.from({ length: SKELETON_COUNT.KPI_TILES }, (_, index) => (
          <KpiTileSkeleton key={index} />
        ))}
      </div>
      <div className={PORTFOLIO_LAYOUT.COLUMNS} aria-hidden="true">
        <div className="card flex min-w-0 flex-col gap-3.5 p-4.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className={PLOT_CLASSES} />
        </div>
        <div className={PORTFOLIO_LAYOUT.ROW_STACK}>
          {Array.from({ length: SKELETON_COUNT.ROWS }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      </div>
    </>
  );
}

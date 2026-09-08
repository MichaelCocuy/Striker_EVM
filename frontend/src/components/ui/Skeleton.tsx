interface SkeletonProps {
  className?: string;
}

/** Loading placeholder; purely decorative, hidden from assistive technology. */
export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

interface SkeletonLinesProps {
  count: number;
  className?: string;
}

const LINE_WIDTH_CLASSES = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'] as const;

export function SkeletonLines({ count, className = '' }: SkeletonLinesProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-3.5 ${LINE_WIDTH_CLASSES[index % LINE_WIDTH_CLASSES.length]}`}
        />
      ))}
    </div>
  );
}

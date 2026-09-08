import { Card } from './Card';
import { SkeletonLines } from './Skeleton';

import type { ReactNode } from 'react';

interface PlaceholderCardProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Custom skeleton composition; defaults to a few text lines. */
  children?: ReactNode;
  className?: string;
}

const DEFAULT_SKELETON_LINES = 4;

/**
 * Intentional placeholder for a dashboard slot that a later module fills in.
 * It carries the slot's title and purpose so the layout reads as finished while loading.
 */
export function PlaceholderCard({
  eyebrow,
  title,
  description,
  children,
  className = '',
}: PlaceholderCardProps) {
  return (
    <Card eyebrow={eyebrow} title={title} description={description} className={className}>
      {children ?? <SkeletonLines count={DEFAULT_SKELETON_LINES} />}
    </Card>
  );
}

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { PORTFOLIO_COPY } from './portfolio-copy';

interface EmptyPortfolioProps {
  /** A reviewer gets the call to action; anyone else gets the plain explanation. */
  canManage: boolean;
  onCreate: () => void;
}

export function EmptyPortfolio({ canManage, onCreate }: EmptyPortfolioProps) {
  return (
    <Card
      eyebrow={PORTFOLIO_COPY.EMPTY.OVERLINE}
      title={PORTFOLIO_COPY.EMPTY.TITLE}
      description={
        canManage ? PORTFOLIO_COPY.EMPTY.REVIEWER_BODY : PORTFOLIO_COPY.EMPTY.READ_ONLY_BODY
      }
    >
      {canManage && (
        <div>
          <Button onClick={onCreate}>{PORTFOLIO_COPY.NEW_PROJECT}</Button>
        </div>
      )}
    </Card>
  );
}

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { MONEY_DECIMALS } from '@/lib/format';

import type { EvmIndicators } from '@/api/types';
import type { IndicatorMeta } from '@/features/evm-report/indicator-copy';

const COPY = {
  /** The three flows are read "al corte"; the budget is the whole project, so it is not. */
  AT_CUTOFF_SUFFIX: ' al corte',
  NAME_SEPARATOR: ' — ',
} as const;

const STRIP_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 border-t border-line pt-3.5';
/** The handoff writes these overlines in subtle ink, not in the teal of a card eyebrow. */
const LABEL_CLASS = 'font-heading text-badge font-bold tracking-wide uppercase text-ink-subtle';
const FIGURE_CLASS = 'numeric text-figure-sm text-ink';

interface BaseValue {
  meta: IndicatorMeta;
  label: string;
  value: number;
}

interface BaseValuesStripProps {
  indicators: EvmIndicators;
}

function atCutoff(meta: IndicatorMeta): string {
  return `${meta.acronym}${COPY.AT_CUTOFF_SUFFIX}`;
}

/**
 * The four base figures of the report under the bridge (handoff §3.2, relocated here
 * because the cumulative S-curve they sat under needs a cut-off history the data model does
 * not have yet). PV, EV and AC are the three anchors of the bridge read to the cent, and
 * BAC is the budget the whole reading is measured against — which is where the tenth
 * indicator of the report lives on this dashboard.
 */
export function BaseValuesStrip({ indicators }: BaseValuesStripProps) {
  const values: BaseValue[] = [
    {
      meta: INDICATORS.PLANNED_VALUE,
      label: atCutoff(INDICATORS.PLANNED_VALUE),
      value: indicators.plannedValue,
    },
    {
      meta: INDICATORS.EARNED_VALUE,
      label: atCutoff(INDICATORS.EARNED_VALUE),
      value: indicators.earnedValue,
    },
    {
      meta: INDICATORS.ACTUAL_COST,
      label: atCutoff(INDICATORS.ACTUAL_COST),
      value: indicators.actualCost,
    },
    {
      meta: INDICATORS.BUDGET_AT_COMPLETION,
      label: INDICATORS.BUDGET_AT_COMPLETION.acronym,
      value: indicators.budgetAtCompletion,
    },
  ];

  return (
    <dl className={STRIP_CLASS}>
      {values.map((base) => (
        <div key={base.meta.acronym} className="flex flex-col gap-0.5">
          <dt className={LABEL_CLASS}>
            {base.label}
            <span className="sr-only">{`${COPY.NAME_SEPARATOR}${base.meta.name}`}</span>
          </dt>
          <dd>
            <AnimatedNumber value={base.value} decimals={MONEY_DECIMALS} className={FIGURE_CLASS} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

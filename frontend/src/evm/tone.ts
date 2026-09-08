import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';

import type { CostStatus, ScheduleStatus } from '@/api/types';
import type { StatusColors } from '@/motion/useStatusColorTween';

/**
 * Presentation mapping of the EVM traffic light (ARQUITECTURA §12): the same four tones
 * drive cards, table cells and charts. No EVM calculation happens here.
 */
export const EVM_TONE = {
  GOOD: 'good',
  NEUTRAL: 'neutral',
  BAD: 'bad',
  NA: 'na',
} as const;

export type EvmTone = (typeof EVM_TONE)[keyof typeof EVM_TONE];

export const EVM_TONE_TOKENS: Record<EvmTone, StatusColors> = {
  [EVM_TONE.GOOD]: { colorToken: '--evm-good', softColorToken: '--evm-good-soft' },
  [EVM_TONE.NEUTRAL]: { colorToken: '--evm-neutral', softColorToken: '--evm-neutral-soft' },
  [EVM_TONE.BAD]: { colorToken: '--evm-bad', softColorToken: '--evm-bad-soft' },
  [EVM_TONE.NA]: { colorToken: '--evm-na', softColorToken: '--evm-na-soft' },
};

export const EVM_TONE_LABEL: Record<EvmTone, string> = {
  [EVM_TONE.GOOD]: 'Favorable',
  [EVM_TONE.NEUTRAL]: 'En meta',
  [EVM_TONE.BAD]: 'Desfavorable',
  [EVM_TONE.NA]: 'No aplica',
};

const COST_STATUS_TONE: Record<CostStatus, EvmTone> = {
  [COST_STATUS.UNDER_BUDGET]: EVM_TONE.GOOD,
  [COST_STATUS.ON_BUDGET]: EVM_TONE.NEUTRAL,
  [COST_STATUS.OVER_BUDGET]: EVM_TONE.BAD,
  [COST_STATUS.NOT_APPLICABLE]: EVM_TONE.NA,
};

const SCHEDULE_STATUS_TONE: Record<ScheduleStatus, EvmTone> = {
  [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: EVM_TONE.GOOD,
  [SCHEDULE_STATUS.ON_SCHEDULE]: EVM_TONE.NEUTRAL,
  [SCHEDULE_STATUS.BEHIND_SCHEDULE]: EVM_TONE.BAD,
  [SCHEDULE_STATUS.NOT_APPLICABLE]: EVM_TONE.NA,
};

export const COST_STATUS_LABEL: Record<CostStatus, string> = {
  [COST_STATUS.UNDER_BUDGET]: 'Bajo presupuesto',
  [COST_STATUS.ON_BUDGET]: 'En presupuesto',
  [COST_STATUS.OVER_BUDGET]: 'Sobre presupuesto',
  [COST_STATUS.NOT_APPLICABLE]: 'No aplica',
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: 'Adelantado',
  [SCHEDULE_STATUS.ON_SCHEDULE]: 'En cronograma',
  [SCHEDULE_STATUS.BEHIND_SCHEDULE]: 'Atrasado',
  [SCHEDULE_STATUS.NOT_APPLICABLE]: 'No aplica',
};

export function costStatusTone(status: CostStatus): EvmTone {
  return COST_STATUS_TONE[status];
}

export function scheduleStatusTone(status: ScheduleStatus): EvmTone {
  return SCHEDULE_STATUS_TONE[status];
}

import { describe, expect, it } from 'vitest';

import { ApiError, ERROR_CODE } from '@/api/errors';
import { HTTP_STATUS } from '@/constants/http';

import {
  ACTIVITY_FIELDS,
  ACTIVITY_FORM_MESSAGES,
  activityErrorFeedback,
  activityFormValuesFrom,
  buildActivityInput,
  EMPTY_ACTIVITY_FORM_VALUES,
  parseDecimalInput,
} from './activity-form';

import type { ActivityFormValues } from './activity-form';
import type { EvmActivityReport } from '@/api/types';

const OWNER_ID = '11111111-1111-4111-8111-000000000003';

const validValues: ActivityFormValues = {
  name: 'Desarrollo',
  ownerId: OWNER_ID,
  budgetAtCompletion: '40000',
  plannedProgressPercent: '50',
  actualProgressPercent: '40',
  actualCost: '20000',
};

function errorsOf(values: Partial<ActivityFormValues>, requiresOwner = false) {
  const result = buildActivityInput({ ...validValues, ...values }, { requiresOwner });
  return result.ok ? {} : result.errors;
}

describe('parseDecimalInput', () => {
  it('accepts the dot and the comma as decimal separators', () => {
    expect(parseDecimalInput('20000.55')).toBe(20000.55);
    expect(parseDecimalInput('20000,55')).toBe(20000.55);
  });

  it('rejects empty and non-numeric text', () => {
    expect(parseDecimalInput('   ')).toBeNull();
    expect(parseDecimalInput('mucho')).toBeNull();
  });
});

describe('buildActivityInput', () => {
  it('builds the request body without ownerId for a registrar', () => {
    const result = buildActivityInput(validValues, { requiresOwner: false });

    expect(result).toEqual({
      ok: true,
      input: {
        name: 'Desarrollo',
        budgetAtCompletion: 40000,
        plannedProgressPercent: 50,
        actualProgressPercent: 40,
        actualCost: 20000,
      },
    });
  });

  it('sends the selected ownerId for a reviewer', () => {
    const result = buildActivityInput(validValues, { requiresOwner: true });

    expect(result.ok && result.input.ownerId).toBe(OWNER_ID);
  });

  it('requires the owner only when the role must choose one', () => {
    expect(errorsOf({ ownerId: '' }, true)).toEqual({
      [ACTIVITY_FIELDS.OWNER_ID]: ACTIVITY_FORM_MESSAGES.OWNER_REQUIRED,
    });
    expect(errorsOf({ ownerId: '' })).toEqual({});
  });

  it('rejects an empty name', () => {
    expect(errorsOf({ name: '  ' })).toEqual({
      [ACTIVITY_FIELDS.NAME]: ACTIVITY_FORM_MESSAGES.NAME_REQUIRED,
    });
  });

  it('rejects a name longer than the contract allows', () => {
    expect(errorsOf({ name: 'a'.repeat(121) })).toEqual({
      [ACTIVITY_FIELDS.NAME]: ACTIVITY_FORM_MESSAGES.NAME_TOO_LONG,
    });
  });

  it('rejects a budget that is not greater than zero', () => {
    expect(errorsOf({ budgetAtCompletion: '0' })).toEqual({
      [ACTIVITY_FIELDS.BUDGET_AT_COMPLETION]: ACTIVITY_FORM_MESSAGES.BUDGET_POSITIVE,
    });
  });

  it('rejects percentages outside 0-100', () => {
    expect(errorsOf({ plannedProgressPercent: '101' })).toEqual({
      [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: ACTIVITY_FORM_MESSAGES.PERCENT_RANGE,
    });
    expect(errorsOf({ actualProgressPercent: '-1' })).toEqual({
      [ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT]: ACTIVITY_FORM_MESSAGES.PERCENT_RANGE,
    });
  });

  it('accepts a zero cost and a zero progress', () => {
    const result = buildActivityInput(
      { ...validValues, actualCost: '0', actualProgressPercent: '0' },
      { requiresOwner: false },
    );

    expect(result.ok).toBe(true);
  });

  it('rejects a negative cost', () => {
    expect(errorsOf({ actualCost: '-10' })).toEqual({
      [ACTIVITY_FIELDS.ACTUAL_COST]: ACTIVITY_FORM_MESSAGES.COST_NEGATIVE,
    });
  });

  it('flags every empty numeric field at once', () => {
    expect(errorsOf(EMPTY_ACTIVITY_FORM_VALUES)).toEqual({
      [ACTIVITY_FIELDS.NAME]: ACTIVITY_FORM_MESSAGES.NAME_REQUIRED,
      [ACTIVITY_FIELDS.BUDGET_AT_COMPLETION]: ACTIVITY_FORM_MESSAGES.NUMBER_INVALID,
      [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: ACTIVITY_FORM_MESSAGES.NUMBER_INVALID,
      [ACTIVITY_FIELDS.ACTUAL_PROGRESS_PERCENT]: ACTIVITY_FORM_MESSAGES.NUMBER_INVALID,
      [ACTIVITY_FIELDS.ACTUAL_COST]: ACTIVITY_FORM_MESSAGES.NUMBER_INVALID,
    });
  });
});

describe('activityFormValuesFrom', () => {
  it('pre-fills the raw measures of the activity being edited', () => {
    const activity: EvmActivityReport = {
      id: 'activity-1',
      name: 'Diseño',
      owner: { id: OWNER_ID, fullName: 'Ana Registradora' },
      input: {
        budgetAtCompletion: 10000,
        plannedProgressPercent: 100,
        actualProgressPercent: 100,
        actualCost: 9000,
      },
      indicators: {
        budgetAtCompletion: 10000,
        plannedValue: 10000,
        earnedValue: 10000,
        actualCost: 9000,
        costVariance: 1000,
        scheduleVariance: 0,
        costPerformanceIndex: 1.1111,
        schedulePerformanceIndex: 1,
        estimateAtCompletion: 9000,
        varianceAtCompletion: 1000,
        costStatus: 'UNDER_BUDGET',
        scheduleStatus: 'ON_SCHEDULE',
        notes: [],
      },
    };

    expect(activityFormValuesFrom(activity)).toEqual({
      name: 'Diseño',
      ownerId: OWNER_ID,
      budgetAtCompletion: '10000',
      plannedProgressPercent: '100',
      actualProgressPercent: '100',
      actualCost: '9000',
    });
  });
});

describe('activityErrorFeedback', () => {
  it('places each VALIDATION_ERROR detail on its field', () => {
    const error = new ApiError(HTTP_STATUS.BAD_REQUEST, {
      code: ERROR_CODE.VALIDATION_ERROR,
      message: 'La solicitud contiene campos inválidos',
      details: [
        { field: 'plannedProgressPercent', message: 'plannedProgressPercent must be 0-100' },
        { field: 'unknownField', message: 'ignored' },
      ],
    });

    expect(activityErrorFeedback(error)).toEqual({
      fieldErrors: {
        [ACTIVITY_FIELDS.PLANNED_PROGRESS_PERCENT]: 'plannedProgressPercent must be 0-100',
      },
      message: null,
    });
  });

  it('keeps a general message when no detail matches a field', () => {
    const error = new ApiError(HTTP_STATUS.FORBIDDEN, {
      code: ERROR_CODE.FORBIDDEN,
      message: 'REGISTRAR users can only modify their own activities',
      details: [],
    });

    expect(activityErrorFeedback(error)).toEqual({
      fieldErrors: {},
      message: 'REGISTRAR users can only modify their own activities',
    });
  });
});

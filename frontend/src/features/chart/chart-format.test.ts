import { describe, expect, it } from 'vitest';

import { AXIS_NAME_MAX_CHARS } from './chart-config';
import { formatCompactMoney, truncateName } from './chart-format';

describe('formatCompactMoney', () => {
  it('shortens the money scale of the y axis in Spanish', () => {
    expect(formatCompactMoney(40000)).toBe('40 mil');
    expect(formatCompactMoney(2500)).toBe('2,5 mil');
  });

  it('leaves small amounts alone', () => {
    expect(formatCompactMoney(0)).toBe('0');
    expect(formatCompactMoney(750)).toBe('750');
  });
});

describe('truncateName', () => {
  it('keeps names that fit the axis', () => {
    expect(truncateName('Desarrollo', AXIS_NAME_MAX_CHARS)).toBe('Desarrollo');
  });

  it('cuts longer names and marks the cut with an ellipsis', () => {
    expect(truncateName('Pruebas de integración', AXIS_NAME_MAX_CHARS)).toBe('Pruebas de…');
  });
});

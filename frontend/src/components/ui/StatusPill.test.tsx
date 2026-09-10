import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EVM_TONE } from '@/evm/tone';

import { STATUS_PILL_SIZE } from './status-pill-sizes';
import { StatusPill } from './StatusPill';

const LABEL = 'Sobre presupuesto';

/** The dot is decorative, so it is the only child element the chip can have. */
function dotOf(pill: HTMLElement): Element | null {
  return pill.querySelector('span[aria-hidden="true"]');
}

describe('StatusPill', () => {
  it('says its tone in words, whatever the size', () => {
    render(
      <>
        <StatusPill tone={EVM_TONE.BAD} label={LABEL} />
        <StatusPill tone={EVM_TONE.BAD} label={LABEL} size={STATUS_PILL_SIZE.SM} />
      </>,
    );

    expect(screen.getAllByText(LABEL)).toHaveLength(2);
    for (const pill of screen.getAllByText(LABEL)) {
      expect(pill).toHaveAttribute('data-tone', EVM_TONE.BAD);
    }
  });

  it('carries the tone dot at the card measure', () => {
    render(<StatusPill tone={EVM_TONE.GOOD} label={LABEL} />);

    expect(dotOf(screen.getByText(LABEL))).not.toBeNull();
  });

  it('drops the dot at the dense measure of a list row', () => {
    render(<StatusPill tone={EVM_TONE.GOOD} label={LABEL} size={STATUS_PILL_SIZE.SM} />);

    const pill = screen.getByText(LABEL);
    expect(dotOf(pill)).toBeNull();
    expect(pill.className).toContain('text-[10.5px]');
    expect(pill.className).toContain('rounded-pill');
  });
});

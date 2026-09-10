import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EVM_TONE } from '@/evm/tone';

import { STATUS_PILL_SIZE } from './status-pill-sizes';
import { StatusPill } from './StatusPill';

const LABEL = 'Sobre presupuesto';
const INDEX = '0,8000';
const NAMED_INDEX = `CPI ${INDEX}`;

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

  it('holds a figure in tabular digits, at the two measures the report needs', () => {
    const { unmount } = render(<StatusPill tone={EVM_TONE.BAD} label={INDEX} />);
    expect(screen.getByText(INDEX).className).not.toContain('tabular-nums');
    unmount();

    render(
      <>
        <StatusPill tone={EVM_TONE.BAD} label={INDEX} size={STATUS_PILL_SIZE.FIGURE} />
        <StatusPill tone={EVM_TONE.BAD} label={NAMED_INDEX} size={STATUS_PILL_SIZE.FIGURE_SM} />
      </>,
    );

    expect(screen.getByText(INDEX).className).toContain('tabular-nums');
    expect(screen.getByText(INDEX).className).toContain('text-caption');
    expect(screen.getByText(NAMED_INDEX).className).toContain('text-badge');
  });

  it('says what a figure means in words, since the number does not carry the tone', () => {
    render(
      <StatusPill
        tone={EVM_TONE.BAD}
        label={INDEX}
        size={STATUS_PILL_SIZE.FIGURE}
        description={LABEL}
      />,
    );

    expect(screen.getByText(INDEX)).toHaveAttribute('data-tone', EVM_TONE.BAD);
    expect(screen.getByText(LABEL)).toHaveClass('sr-only');
  });

  it('adds no wrapper when the label already says the tone', () => {
    render(<StatusPill tone={EVM_TONE.GOOD} label={LABEL} size={STATUS_PILL_SIZE.SM} />);

    expect(screen.getByText(LABEL).parentElement).toBe(document.body.firstElementChild);
  });
});

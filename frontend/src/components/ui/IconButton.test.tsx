import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ICON_BUTTON_SIZE, ICON_BUTTON_TONE } from './icon-button-tones';
import { IconButton } from './IconButton';
import { ICON_SIZE, ICON_STROKE, Trash2 } from './icons';

import type { IconButtonSize, IconButtonTone } from './icon-button-tones';

const LABEL = 'Eliminar Portal de clientes';

interface RenderOptions {
  tone?: IconButtonTone;
  size?: IconButtonSize;
  onClick?: () => void;
}

function renderIconButton(options: RenderOptions = {}) {
  return render(
    <IconButton
      label={LABEL}
      icon={<Trash2 aria-hidden="true" size={ICON_SIZE.SIDEBAR} strokeWidth={ICON_STROKE.UI} />}
      {...options}
    />,
  );
}

function classesOf(name: string): string[] {
  return screen.getByRole('button', { name }).className.split(' ');
}

describe('IconButton', () => {
  it('takes its accessible name from the label, since the icon carries no text', () => {
    renderIconButton();

    expect(screen.getByRole('button', { name: LABEL })).toHaveAttribute('title', LABEL);
  });

  it('is a 36px square in the topbar and a 32px one in a dense row', () => {
    const { unmount } = renderIconButton();
    expect(classesOf(LABEL)).toContain('size-9');
    unmount();

    renderIconButton({ size: ICON_BUTTON_SIZE.SM });
    expect(classesOf(LABEL)).toContain('size-8');
  });

  it('draws a destructive action in the danger ink without filling it', () => {
    renderIconButton({ tone: ICON_BUTTON_TONE.DANGER });

    const classes = classesOf(LABEL);
    expect(classes).toContain('text-danger');
    expect(classes).toContain('hover:enabled:bg-danger-soft');
    expect(classes).not.toContain('bg-danger-soft');
  });

  it('forwards the press', async () => {
    const onClick = vi.fn();
    renderIconButton({ onClick });

    await userEvent.click(screen.getByRole('button', { name: LABEL }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});

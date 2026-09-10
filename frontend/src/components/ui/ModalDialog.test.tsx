import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ModalDialog } from './ModalDialog';

const COPY = {
  TITLE: 'Nueva actividad',
  CLOSE: 'Cerrar',
  BEHIND: 'Botón de la página',
  FIRST: 'Primer campo',
  LAST: 'Guardar',
} as const;

/**
 * The dialog opens over a page that keeps its own focusable control: that control is what the
 * keyboard must never reach while the dialog is open.
 */
function renderDialogOverThePage(onClose: () => void = vi.fn()) {
  return render(
    <>
      <button type="button">{COPY.BEHIND}</button>
      <ModalDialog title={COPY.TITLE} onClose={onClose}>
        <button type="button">{COPY.FIRST}</button>
        <button type="button">{COPY.LAST}</button>
      </ModalDialog>
    </>,
  );
}

function buttonNamed(name: string): HTMLElement {
  return screen.getByRole('button', { name });
}

describe('ModalDialog', () => {
  it('takes focus itself when it opens', () => {
    renderDialogOverThePage();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('cycles Tab inside the dialog and never lands on the page behind', async () => {
    renderDialogOverThePage();

    await userEvent.tab();
    expect(buttonNamed(COPY.CLOSE)).toHaveFocus();

    await userEvent.tab();
    expect(buttonNamed(COPY.FIRST)).toHaveFocus();

    await userEvent.tab();
    expect(buttonNamed(COPY.LAST)).toHaveFocus();

    await userEvent.tab();
    expect(buttonNamed(COPY.CLOSE)).toHaveFocus();
    expect(buttonNamed(COPY.BEHIND)).not.toHaveFocus();
  });

  it('wraps Shift+Tab from the first control round to the last', async () => {
    renderDialogOverThePage();

    await userEvent.tab({ shift: true });

    expect(buttonNamed(COPY.LAST)).toHaveFocus();
    expect(buttonNamed(COPY.BEHIND)).not.toHaveFocus();
  });

  it('closes on Escape and on the close button', async () => {
    const onClose = vi.fn();
    renderDialogOverThePage(onClose);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();

    await userEvent.click(buttonNamed(COPY.CLOSE));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

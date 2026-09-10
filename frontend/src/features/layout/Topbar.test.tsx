import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ROLES } from '@/api/types';
import { TEST_USERS } from '@/test/render';
import { ThemeProvider } from '@/theme/ThemeProvider';

import { DESKTOP_MIN_WIDTH_PX, LAYOUT_ID } from './layout-constants';
import { Topbar } from './Topbar';

import type { PageLocation } from './page-locations';

const LOCATION: PageLocation = { crumb: 'Portafolio', title: 'Todos los proyectos' };

const NAME = {
  LOGOUT: 'Salir',
  ALERTS: 'Alertas',
  SEARCH: /buscar en striker evm/i,
  TOGGLE: /mostrar u ocultar la navegación/i,
} as const;

interface RenderOptions {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

function renderTopbar({
  isSidebarOpen = false,
  onToggleSidebar = vi.fn(),
  onLogout = vi.fn(),
}: RenderOptions = {}) {
  return render(
    <ThemeProvider>
      <Topbar
        user={TEST_USERS[ROLES.REVIEWER]}
        location={LOCATION}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onLogout={onLogout}
      />
    </ThemeProvider>,
  );
}

/** The element that owns the search field's border, which is the flex child that gives way. */
function searchBox(): HTMLElement {
  const input = screen.getByLabelText(NAME.SEARCH);
  const box = input.parentElement;
  if (box === null) {
    throw new Error('The search field has no container');
  }
  return box;
}

describe('Topbar', () => {
  it('says where the reader is, crumb over place', () => {
    renderTopbar();

    expect(screen.getByText(LOCATION.crumb)).toBeInTheDocument();
    expect(screen.getByText(LOCATION.title)).toBeInTheDocument();
  });

  /**
   * The handoff asks for `scrollWidth === clientWidth` on the band at 900px. jsdom performs no
   * layout, so both are 0 there and measuring proves nothing; the contract that makes the
   * overflow impossible is asserted instead. The search is the only child allowed to shrink
   * (`flex-[1_1_0]` with `min-w-0` on the box and on the input), and every fixed control is
   * `shrink-0`, so the sum of the fixed widths is the band's own minimum.
   */
  it(`keeps the search as the only elastic element, so the band cannot overflow at ${DESKTOP_MIN_WIDTH_PX}px`, () => {
    renderTopbar();

    const box = searchBox();
    expect(box.className).toContain('flex-[1_1_0]');
    expect(box.className).toContain('min-w-0');
    expect(box.className).toContain('max-w-[220px]');
    expect(screen.getByLabelText(NAME.SEARCH).className).toContain('min-w-0');

    for (const fixed of [
      screen.getByRole('button', { name: NAME.ALERTS }).parentElement,
      screen.getByTestId('user-chip'),
      screen.getByRole('button', { name: NAME.LOGOUT }),
    ]) {
      expect(fixed?.className).toContain('shrink-0');
    }
  });

  it('reports whether the navigation drawer is open, and asks to toggle it', async () => {
    const onToggleSidebar = vi.fn();
    renderTopbar({ isSidebarOpen: true, onToggleSidebar });

    const toggle = screen.getByRole('button', { name: NAME.TOGGLE });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', LAYOUT_ID.SIDEBAR);

    await userEvent.click(toggle);

    expect(onToggleSidebar).toHaveBeenCalledOnce();
  });

  it('opens the alerts panel from the bell and closes it with Escape', async () => {
    renderTopbar();
    const bell = screen.getByRole('button', { name: NAME.ALERTS });

    await userEvent.click(bell);

    expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/no hay alertas/i)).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(bell).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/no hay alertas/i)).not.toBeInTheDocument();
  });

  it('logs out from the topbar', async () => {
    const onLogout = vi.fn();
    renderTopbar({ onLogout });

    await userEvent.click(screen.getByRole('button', { name: NAME.LOGOUT }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('names every icon-only control, so none of them is a bare glyph', () => {
    renderTopbar();

    for (const name of [NAME.ALERTS, NAME.TOGGLE, /cambiar a tema/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

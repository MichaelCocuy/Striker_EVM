import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { IconButton } from '@/components/ui/IconButton';
import { ICON_SIZE, ICON_STROKE, Menu } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import { LAYOUT_ID } from './layout-constants';
import { TopbarAlerts } from './TopbarAlerts';
import { TopbarSearch } from './TopbarSearch';
import { UserChip } from './UserChip';

import type { PageLocation } from './page-locations';
import type { User } from '@/api/types';

interface TopbarProps {
  user: User;
  location: PageLocation;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const COPY = {
  LOGOUT: 'Salir',
  TOGGLE_SIDEBAR: 'Mostrar u ocultar la navegación',
} as const;

/**
 * White band with the teal edge that separates the navy sidebar from the canvas.
 *
 * The layout is one rule: everything except the search is `shrink-0`, and the search is
 * `flex-[1_1_0]` with `min-w-0`. That makes the search the only element that can give way, so
 * the band's content can never be wider than the band itself.
 */
const HEADER_CLASSES =
  'sticky top-0 z-30 flex min-h-[var(--tc-topbar-h)] items-center justify-between gap-4 border-t-[3px] border-b border-t-accent-bright border-b-line bg-[image:var(--tc-topbar-bg)] px-[26px] py-3 shadow-card';

export function Topbar({ user, location, isSidebarOpen, onToggleSidebar, onLogout }: TopbarProps) {
  return (
    <header className={HEADER_CLASSES}>
      <div className="flex min-w-0 flex-[0_1_auto] items-center gap-3 overflow-hidden">
        <IconButton
          label={COPY.TOGGLE_SIDEBAR}
          aria-expanded={isSidebarOpen}
          aria-controls={LAYOUT_ID.SIDEBAR}
          onClick={onToggleSidebar}
          className="min-[900px]:hidden"
          icon={<Menu aria-hidden="true" size={ICON_SIZE.CONTENT} strokeWidth={ICON_STROKE.UI} />}
        />
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-[11px] font-medium tracking-[0.7px] text-ink-subtle uppercase">
            {location.crumb}
          </p>
          <p className="truncate font-heading text-[19px] font-bold tracking-figure text-ink">
            {location.title}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_auto] items-center justify-end gap-3">
        <TopbarSearch />
        <TopbarAlerts />
        <ThemeToggle />
        <UserChip user={user} />
        <Button variant={BUTTON_VARIANT.GHOST} onClick={onLogout} className="shrink-0">
          {COPY.LOGOUT}
        </Button>
      </div>
    </header>
  );
}

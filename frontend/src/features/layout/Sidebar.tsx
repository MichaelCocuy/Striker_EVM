import { NavLink } from 'react-router-dom';

import { BRAND_MARK_TONE } from '@/components/ui/brand-variants';
import { BrandMark } from '@/components/ui/BrandMark';
import { ICON_SIZE, ICON_STROKE } from '@/components/ui/icons';
import { ROUTES } from '@/constants/routes';

import { LAYOUT_ID } from './layout-constants';
import { navGroupsForRole } from './nav-items';

import type { NavItem } from './nav-items';
import type { Role } from '@/api/types';

interface SidebarProps {
  role: Role;
  /** The project the reader has open, so the dashboard item knows where to point. */
  projectId: string | null;
  /** Below the desktop breakpoint the sidebar is a drawer the topbar opens. */
  isOpen: boolean;
}

const COPY = {
  HOME: 'Ir al inicio',
  FOOTER: 'Trycore S.A.S. · Striker EVM',
  LANDMARK: 'Barra lateral',
} as const;

/**
 * Fixed while it behaves as a drawer, static once the viewport is wide enough for the shell.
 * The navy gradient and its shadow are what let the canvas beside it be almost white.
 */
const PANEL_CLASSES =
  'fixed inset-y-0 left-0 z-40 w-[var(--tc-sidebar-w)] flex-col bg-[image:var(--tc-grad-sidebar)] shadow-[var(--tc-sidebar-shadow)] min-[900px]:static min-[900px]:z-auto min-[900px]:flex min-[900px]:shrink-0';

const GROUP_TITLE_CLASSES =
  'px-4 pt-[14px] pb-1 font-heading text-badge font-semibold tracking-wide text-accent-on-navy/50 uppercase';

const NAV_ITEM_BASE_CLASSES =
  'mx-2 my-px flex items-center gap-[9px] rounded-md px-2.5 py-2 text-[14px] transition-[background-color,color,transform] duration-150';

const NAV_ITEM_STATE_CLASSES = {
  ACTIVE:
    'bg-accent-on-navy/16 font-semibold text-[var(--tc-nav-ink-active)] shadow-[var(--tc-nav-ring-active)]',
  REST: 'text-white/68 hover:translate-x-0.5 hover:bg-white/9 hover:text-white',
} as const;

export function Sidebar({ role, projectId, isOpen }: SidebarProps) {
  return (
    <aside
      id={LAYOUT_ID.SIDEBAR}
      aria-label={COPY.LANDMARK}
      className={`${PANEL_CLASSES} ${isOpen ? 'flex' : 'hidden'}`}
    >
      <div className="border-b border-accent-on-navy/15 px-[18px] py-[17px]">
        <NavLink to={ROUTES.ROOT} aria-label={COPY.HOME} className="inline-flex">
          <BrandMark tone={BRAND_MARK_TONE.ON_NAVY} />
        </NavLink>
      </div>

      <div className="flex-1 pb-3">
        {navGroupsForRole(role, projectId).map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className={GROUP_TITLE_CLASSES}>{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="border-t border-white/8 px-[18px] py-3 text-[11px] text-white/32">
        {COPY.FOOTER}
      </p>
    </aside>
  );
}

interface SidebarLinkProps {
  item: NavItem;
}

function SidebarLink({ item }: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        `${NAV_ITEM_BASE_CLASSES} ${isActive ? NAV_ITEM_STATE_CLASSES.ACTIVE : NAV_ITEM_STATE_CLASSES.REST}`
      }
    >
      <Icon
        aria-hidden="true"
        size={ICON_SIZE.SIDEBAR}
        strokeWidth={ICON_STROKE.UI}
        className="shrink-0"
      />
      {item.label}
    </NavLink>
  );
}

import { NavLink } from 'react-router-dom';

import { BrandMark } from '@/components/ui/BrandMark';
import { ROUTES } from '@/constants/routes';

import { navItemsForRole } from './nav-items';

import type { Role } from '@/api/types';

interface SidebarProps {
  role: Role;
}

const NAV_LABEL = 'Navegación principal';

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
  }`;

export function Sidebar({ role }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r border-line bg-surface-overlay px-5 py-6 backdrop-blur md:flex">
      <NavLink to={ROUTES.ROOT} aria-label="Ir al inicio">
        <BrandMark />
      </NavLink>
      <nav aria-label={NAV_LABEL} className="flex flex-col gap-1">
        {navItemsForRole(role).map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClasses}>
            <span aria-hidden="true" className="size-1.5 rounded-pill bg-current opacity-60" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

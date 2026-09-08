import { NavLink } from 'react-router-dom';

import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import { navItemsForRole } from './nav-items';
import { UserChip } from './UserChip';

import type { User } from '@/api/types';

interface TopbarProps {
  user: User;
  onLogout: () => void;
}

const LOGOUT_LABEL = 'Cerrar sesión';
const MOBILE_NAV_LABEL = 'Navegación';

const mobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-pill px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:text-ink'
  }`;

export function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-surface-overlay px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="md:hidden">
          <BrandMark compact />
        </div>
        <div className="hidden md:block">
          <UserChip user={user} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant={BUTTON_VARIANT.GHOST} onClick={onLogout}>
            {LOGOUT_LABEL}
          </Button>
        </div>
      </div>
      <nav aria-label={MOBILE_NAV_LABEL} className="flex items-center gap-2 md:hidden">
        {navItemsForRole(user.role).map((item) => (
          <NavLink key={item.to} to={item.to} className={mobileLinkClasses}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

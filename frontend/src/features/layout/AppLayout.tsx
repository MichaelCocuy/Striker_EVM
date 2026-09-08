import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/useAuth';
import { usePageTransition } from '@/motion/usePageTransition';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const MAIN_ID = 'main-content';
const SKIP_LINK_LABEL = 'Saltar al contenido';

/** Authenticated shell: sidebar + topbar + animated main outlet. Rendered inside RequireAuth. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const mainRef = usePageTransition<HTMLElement>(location.pathname);

  if (user === null) {
    return null;
  }

  return (
    <div className="flex min-h-dvh">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {SKIP_LINK_LABEL}
      </a>
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onLogout={logout} />
        <main
          id={MAIN_ID}
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

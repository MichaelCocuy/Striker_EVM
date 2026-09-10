import { useCallback, useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';

import { ROUTE_PARAMS, ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/useAuth';
import { usePageTransition } from '@/motion/usePageTransition';

import { LAYOUT_ID } from './layout-constants';
import { pageLocationFor } from './page-locations';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COPY = {
  SKIP_TO_CONTENT: 'Saltar al contenido',
  CLOSE_SIDEBAR: 'Cerrar la navegación',
} as const;

const SKIP_LINK_CLASSES =
  'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2';

/** Authenticated shell: navy sidebar, teal-edged topbar and the animated main outlet. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const mainRef = usePageTransition<HTMLElement>(location.pathname);
  /**
   * The drawer remembers the route it was opened on, so following one of its links closes it
   * without an effect that reacts to the navigation.
   */
  const [sidebarOpenAtPath, setSidebarOpenAtPath] = useState<string | null>(null);
  const isSidebarOpen = sidebarOpenAtPath === location.pathname;

  const closeSidebar = useCallback(() => setSidebarOpenAtPath(null), []);
  const toggleSidebar = useCallback(() => {
    setSidebarOpenAtPath((current) => (current === location.pathname ? null : location.pathname));
  }, [location.pathname]);

  if (user === null) {
    return null;
  }

  const projectMatch = matchPath(ROUTES.PROJECT_DASHBOARD, location.pathname);
  const projectId = projectMatch?.params[ROUTE_PARAMS.PROJECT_ID] ?? null;

  return (
    <div className="flex min-h-dvh">
      <a href={`#${LAYOUT_ID.MAIN}`} className={SKIP_LINK_CLASSES}>
        {COPY.SKIP_TO_CONTENT}
      </a>
      <Sidebar role={user.role} projectId={projectId} isOpen={isSidebarOpen} />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label={COPY.CLOSE_SIDEBAR}
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-navy/45 min-[900px]:hidden"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          location={pageLocationFor(location.pathname)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onLogout={logout}
        />
        <main
          id={LAYOUT_ID.MAIN}
          ref={mainRef}
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col gap-[18px] px-[26px] pt-6 pb-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

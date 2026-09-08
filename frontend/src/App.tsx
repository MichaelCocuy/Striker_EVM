import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

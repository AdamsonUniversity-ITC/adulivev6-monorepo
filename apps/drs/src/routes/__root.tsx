import { Toaster } from '@repo/ui/components/sonner';
import { AuthLayout } from '@repo/ui/layouts/auth-layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { DrsNotFoundPage } from '@/components/drs-not-found-page.tsx';
import { DrsThemeProvider } from '@/components/drs-theme-provider.tsx';
import { DrsThemeToggle } from '@/components/drs-theme-toggle.tsx';

const queryClient = new QueryClient();

const RootLayout = () => (
  <QueryClientProvider client={queryClient}>
    <DrsThemeProvider>
      <AuthLayout />
      <DrsThemeToggle />
      <Toaster richColors />
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </DrsThemeProvider>
  </QueryClientProvider>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: DrsNotFoundPage,
});

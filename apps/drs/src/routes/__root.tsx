import { Toaster } from '@repo/ui/components/sonner';
import { AuthLayout } from '@repo/ui/layouts/auth-layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { DrsNotFoundPage } from '@/components/drs-not-found-page.tsx';

const queryClient = new QueryClient();

const RootLayout = () => (
  <QueryClientProvider client={queryClient}>
    <AuthLayout />
    <Toaster richColors />
    <Outlet />
    {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
  </QueryClientProvider>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: DrsNotFoundPage,
});

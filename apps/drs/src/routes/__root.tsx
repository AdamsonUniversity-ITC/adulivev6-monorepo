import { AuthLayout } from '@repo/ui/layouts/auth-layout';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const RootLayout = () => (
  <>
    <AuthLayout/>
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });

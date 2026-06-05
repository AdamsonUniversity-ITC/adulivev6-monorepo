import { Toaster } from '@repo/ui/components/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const queryClient = new QueryClient()

const RootLayout = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster richColors />
    <Outlet />
    <TanStackRouterDevtools />
  </QueryClientProvider>
)

export const Route = createRootRoute({ component: RootLayout })

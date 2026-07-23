import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@repo/ui/components/sonner'

import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { authUserQueryOptions, myHrProfileQueryOptions } from '@/lib/auth-queries'
import {
  canAccessEleaveRoute,
  matchesEleaveRestrictedRoute,
  routeRequiresHrProfile,
} from '@/lib/eleave-route-access'
import { ensureAuthenticated, redirectToLoginIfUnauthorized } from '@/lib/ensure-authenticated'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    await ensureAuthenticated(context.queryClient)

    if (!matchesEleaveRestrictedRoute(location.pathname)) {
      return
    }

    try {
      const authUser = await context.queryClient.ensureQueryData(authUserQueryOptions)
      const profile = routeRequiresHrProfile(location.pathname)
        ? await context.queryClient.ensureQueryData(myHrProfileQueryOptions)
        : undefined

      if (!canAccessEleaveRoute(location.pathname, { user: authUser, profile })) {
        throw redirect({ to: '/forbidden' })
      }
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        await new Promise<void>(() => {})
      }

      throw error
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="font-medium">E-Leave</span>
          </header>
          <div className="flex flex-1 flex-col p-4">
            <Outlet />
          </div>
        </SidebarInset>
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
      </SidebarProvider>
      <Toaster richColors />
    </TooltipProvider>
  )
}

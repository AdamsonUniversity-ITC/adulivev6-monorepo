import {
  Outlet,
  createRootRouteWithContext,
  Link,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { AuthLayout } from "@repo/ui/layouts/auth-layout";
import { Toaster } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { getBoardSubdomain, isPlatformHost } from "@/lib/adutsHost";
import { ensureAuthenticated } from "@/lib/ensure-authenticated";
import { authUserQueryOptions } from "@/lib/auth-queries";
import {
  isBoardAdminCapability,
  isSuperAdmin,
  normalizePermissions,
} from "@/lib/aduts-access";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    await ensureAuthenticated(context.queryClient);
  },
  component: RootComponent,
});

function RootComponent() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const boardSlug = getBoardSubdomain(hostname);
  const platform = isPlatformHost(hostname);

  const authQuery = useQuery(authUserQueryOptions);
  const permissions = normalizePermissions(authQuery.data ?? {});
  const showAdmin = platform && isSuperAdmin(permissions);
  const showManage = !platform && isBoardAdminCapability(permissions);

  return (
    <div className="bg-background min-h-screen">
      <AuthLayout />
      <Toaster richColors />
      <div className="border-border bg-card/80 border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="leading-tight">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              AdUTS
            </p>
            <p className="text-sm font-medium">
              {platform ? "Ticketing Platform" : `${boardSlug} board`}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tickets">Tickets</Link>
            </Button>
            {!platform && (
              <Button size="sm" asChild>
                <Link to="/tickets/new">New ticket</Link>
              </Button>
            )}
            {showAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
            )}
            {showManage && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/manage">Manage</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/manage/staff">Staff</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/manage/customers">Customers</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/manage/admins">Admins</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

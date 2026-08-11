import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AuthLayout } from "@repo/ui/layouts/auth-layout";
import { Toaster } from "@repo/ui/components/sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsHelpDialog } from "@/components/shortcuts-help-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAdutsShortcuts } from "@/hooks/use-aduts-shortcuts";
import { fetchCurrentBoard } from "@/lib/aduts-api";
import { getBoardSubdomain, isPlatformHost } from "@/lib/adutsHost";
import {
  accentForeground,
  normalizeAccentColor,
  normalizeThemePreset,
} from "@/lib/board-theme";
import { formatBoardLabel } from "@/lib/format-labels";
import { ensureAuthenticated } from "@/lib/ensure-authenticated";
import { Button } from "@repo/ui/components/button";

export interface RouterContext {
  queryClient: QueryClient;
}

const ACCENT_VARS = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--primary-foreground",
  "--sidebar-primary-foreground",
] as const;

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useAdutsShortcuts({
    onOpenPalette: () => setPaletteOpen(true),
    onOpenHelp: () => setHelpOpen(true),
  });

  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
    enabled: !platform,
  });

  const headerLabel = platform
    ? "Ticketing Platform"
    : (boardQuery.data?.board_name ?? formatBoardLabel(boardSlug ?? ""));

  const themePreset = platform
    ? undefined
    : normalizeThemePreset(boardQuery.data?.theme_preset);
  const accent = platform
    ? null
    : normalizeAccentColor(boardQuery.data?.accent_color);

  useEffect(() => {
    const root = document.documentElement;

    if (platform || !themePreset) {
      delete root.dataset.boardTheme;
    } else {
      root.dataset.boardTheme = themePreset;
    }

    if (accent) {
      const fg = accentForeground(accent);
      root.style.setProperty("--primary", accent);
      root.style.setProperty("--ring", accent);
      root.style.setProperty("--sidebar-primary", accent);
      root.style.setProperty("--sidebar-ring", accent);
      root.style.setProperty("--primary-foreground", fg);
      root.style.setProperty("--sidebar-primary-foreground", fg);
    } else {
      for (const prop of ACCENT_VARS) {
        root.style.removeProperty(prop);
      }
    }

    return () => {
      delete root.dataset.boardTheme;
      for (const prop of ACCENT_VARS) {
        root.style.removeProperty(prop);
      }
    };
  }, [platform, themePreset, accent]);

  return (
    <div
      className="aduts-shell flex min-h-screen flex-col"
      data-theme-preset={themePreset}
    >
      <div className="aduts-shell-content flex min-h-screen flex-1 flex-col">
        <AuthLayout />
        <Toaster richColors theme="system" />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <ShortcutsHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
        <SidebarProvider className="bg-transparent has-data-[variant=inset]:bg-transparent! min-h-0 min-h-[calc(100svh-3.5rem)] flex-1">
          <AppSidebar />
          <SidebarInset className="bg-background/50 supports-backdrop-filter:bg-background/35 backdrop-blur-[2px]">
            <header className="border-border/50 bg-background/65 supports-backdrop-filter:bg-background/45 sticky top-14 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Ticketing System
                </p>
                <p className="truncate text-sm font-semibold tracking-tight">
                  {headerLabel}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shadow-xs hidden sm:inline-flex"
                onClick={() => setPaletteOpen(true)}
              >
                Search
                <kbd className="text-muted-foreground ml-2 hidden font-mono text-[10px] md:inline">
                  ⌘K
                </kbd>
              </Button>
              <ThemeToggle />
            </header>
            <div className="aduts-page-enter flex flex-1 flex-col px-4 py-6 sm:px-6 md:py-8">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}

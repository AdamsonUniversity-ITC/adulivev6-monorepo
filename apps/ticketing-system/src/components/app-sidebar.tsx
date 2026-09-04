import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronRight,
  Contact,
  FileText,
  Home,
  LayoutGrid,
  Plus,
  Settings2,
  Tags,
  Ticket,
  Users,
  UserCog,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@repo/ui/components/sidebar";
import { getBoardSubdomain, isPlatformHost } from "@/lib/adutsHost";
import { fetchCurrentBoard } from "@/lib/aduts-api";
import { authUserQueryOptions } from "@/lib/auth-queries";
import {
  isBoardAdminCapability,
  isSuperAdmin,
  normalizePermissions,
} from "@/lib/aduts-access";
import { formatBoardLabel } from "@/lib/format-labels";

type NavItem = {
  title: string;
  url: string;
  icon: typeof Home;
};

function isNavItemActive(pathname: string, url: string) {
  if (url === "/") {
    return pathname === "/";
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isMaintenancePath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/manage");
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const boardSlug = getBoardSubdomain(hostname);
  const platform = isPlatformHost(hostname);

  const authQuery = useQuery(authUserQueryOptions);
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
    enabled: !platform,
  });
  const permissions = normalizePermissions(authQuery.data ?? {});
  const showAdmin = platform && isSuperAdmin(permissions);
  const showManage = !platform && isBoardAdminCapability(permissions);
  const boardAccess = boardQuery.data?.access;
  const showSectionResources =
    !platform &&
    (boardAccess?.is_board_admin === true ||
      boardAccess?.is_section_head === true);
  const showReports = !platform && boardAccess?.can_view_reports === true;

  const headerLabel = platform
    ? "Ticketing Platform"
    : (boardQuery.data?.board_name ?? formatBoardLabel(boardSlug ?? ""));

  const mainNavItems: NavItem[] = [
    { title: "Home", url: "/", icon: Home },
    { title: "Tickets", url: "/tickets", icon: Ticket },
    ...(!platform
      ? [{ title: "New ticket", url: "/tickets/new", icon: Plus } as NavItem]
      : []),
    ...(showReports
      ? [{ title: "Reports", url: "/reports", icon: BarChart3 } as NavItem]
      : []),
  ];

  const maintenanceNavItems: NavItem[] = [
    ...(showAdmin
      ? [{ title: "Boards", url: "/admin", icon: LayoutGrid } as NavItem]
      : []),
    ...(showManage
      ? [
          { title: "Settings", url: "/manage", icon: Settings2 },
          { title: "Staff", url: "/manage/staff", icon: Users },
          { title: "Customers", url: "/manage/customers", icon: Contact },
          { title: "Admins", url: "/manage/admins", icon: UserCog },
        ]
      : []),
    ...(showManage || showSectionResources
      ? [
          { title: "Categories", url: "/manage/categories", icon: Tags },
          { title: "Templates", url: "/manage/templates", icon: FileText },
        ]
      : []),
  ];

  const showMaintenance = maintenanceNavItems.length > 0;
  const maintenanceActive = isMaintenancePath(pathname);
  const [maintenanceOpen, setMaintenanceOpen] = useState(maintenanceActive);

  useEffect(() => {
    if (maintenanceActive) {
      setMaintenanceOpen(true);
    }
  }, [maintenanceActive]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="top-14 inset-y-auto h-[calc(100svh-3.5rem)] bg-sidebar/80 backdrop-blur-md"
    >
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="AdUTS">
              <Link to="/">
                <div className="ring-primary/10 flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
                  <img
                    src="/assets/images/adulogo.png"
                    alt="Adamson University"
                    className="size-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    Ticketing System
                  </span>
                  <span className="truncate text-sm font-semibold">
                    {headerLabel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {showMaintenance ? (
                <Collapsible
                  asChild
                  open={maintenanceOpen}
                  onOpenChange={setMaintenanceOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Maintenance"
                        isActive={maintenanceActive}
                      >
                        <Wrench />
                        <span>Maintenance</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {maintenanceNavItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isNavItemActive(pathname, item.url)}
                            >
                              <Link to={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

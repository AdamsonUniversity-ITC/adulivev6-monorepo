import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FolderOpen,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyEmployeeHrProfile } from "@/hooks/use-employee-hr-profile";
import {
  getAvatarUrlFromEmpNo,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display";
import { canAccessEleaveRoute } from "@/lib/eleave-route-access";
import { resolveDisplayName, resolveEmployeeNo } from "@/lib/fetch-auth-user";
import { resolveHrmdoPortalUrl } from "@/lib/resolve-adu-live-url";

const mainNavItems = [
  { title: "Guidelines", url: "/guidelines", icon: BookOpen },
  { title: "My Leave", url: "/my-leave", icon: CalendarDays },
  { title: "For Approval", url: "/for-approval", icon: ClipboardCheck },
  { title: "HR Approval", url: "/hr-approval", icon: UserCheck },
] as const;

const adminNavItems = [
  { title: "Beginning Balances", url: "/beginning-balances", icon: Wallet },
  { title: "Employee Leave Credits", url: "/employee-leave-credits", icon: CreditCard },
] as const;

const reportNavItems = [
  { title: "Filed Leave", url: "/reports/filed-leave", icon: FolderOpen },
  { title: "Filed Leave After Cutoff", url: "/reports/filed-leave-after-cutoff", icon: FolderOpen },
] as const;

function isNavItemActive(pathname: string, url: string) {
  if (
    url === "/my-leave" ||
    url === "/for-approval" ||
    url === "/hr-approval" ||
    url === "/beginning-balances" ||
    url === "/employee-leave-credits"
  ) {
    return pathname === url || pathname.startsWith(`${url}/`);
  }
  return pathname === url;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [reportsOpen, setReportsOpen] = useState(() =>
    pathname.startsWith("/reports"),
  );
  const isReportsActive = pathname.startsWith("/reports");

  const { data: authUser } = useAuthUser();
  const { data: hrProfile } = useMyEmployeeHrProfile();
  const empNo =
    hrProfile?.emp_no?.trim() ||
    (authUser ? resolveEmployeeNo(authUser) : null);
  const displayName =
    hrProfile?.full_name?.trim() ||
    (authUser ? resolveDisplayName(authUser) : "Loading...");
  const email = hrProfile?.email?.trim() || authUser?.email || "";
  const avatarUrl = getAvatarUrlFromEmpNo(empNo);
  const initials = getInitialsFromDisplayName(displayName, empNo, "EL");

  const visibleMainNavItems = mainNavItems.filter((item) =>
    canAccessEleaveRoute(item.url, { user: authUser, profile: hrProfile }),
  );

  function canViewNavItem(url: string): boolean {
    return canAccessEleaveRoute(url, { user: authUser, profile: hrProfile });
  }

  const visibleAdminNavItems = adminNavItems.filter((item) =>
    canViewNavItem(item.url),
  );
  const visibleReportNavItems = reportNavItems.filter((item) =>
    canViewNavItem(item.url),
  );
  const canViewReports = visibleReportNavItems.length > 0;
  const hrmdoPortalUrl = resolveHrmdoPortalUrl();

  useEffect(() => {
    if (pathname.startsWith("/reports")) {
      setReportsOpen(true);
    }
  }, [pathname]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-indigo-100/60 !bg-[linear-gradient(135deg,#f0f4ff_0%,#ffffff_100%)] shadow-2xl backdrop-blur-2xl transition-colors dark:border-indigo-900/40 dark:!bg-[linear-gradient(135deg,#0a0f1c_0%,#0f172a_100%)]"
    >
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-auto overflow-hidden rounded-3xl border-none bg-transparent p-2 transition-all hover:bg-sidebar-accent/40 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0"
            >
              <Link to="/my-leave">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md ring-primary/20 transition-all group-data-[state=expanded]:size-12 group-data-[state=expanded]:rounded-2xl group-data-[state=expanded]:ring-4">
                  <CalendarDays className="size-4 transition-all group-data-[state=expanded]:size-6" />
                </div>
                <div className="ml-2 grid flex-1 text-left leading-tight transition-all group-data-[collapsible=icon]:hidden">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary/70 mb-0.5">
                    Adamson University
                  </span>
                  <span className="text-base font-extrabold tracking-tight text-sidebar-foreground leading-none">
                    E-Leave
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium text-sidebar-foreground/60">
                    HRMDO Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="px-2 pt-1 group-data-[collapsible=icon]:px-1">
          <SidebarGroupLabel className="px-1 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleMainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.url)}
                    tooltip={item.title}
                    className="relative h-10 rounded-full px-3 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:hover:bg-primary/90 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
                  >
                    <Link to={item.url}>
                      <item.icon className="mr-1 size-5 opacity-70 transition-opacity group-data-[collapsible=icon]:mr-0 group-[[data-active=true]]:opacity-100" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {visibleAdminNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.url)}
                    tooltip={item.title}
                    className="relative h-10 rounded-full px-3 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:hover:bg-primary/90 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
                  >
                    <Link to={item.url}>
                      <item.icon className="mr-2 size-5 opacity-70 transition-opacity group-data-[collapsible=icon]:mr-0 group-[[data-active=true]]:opacity-100" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {canViewReports ? (
              <Collapsible
                asChild
                open={reportsOpen}
                onOpenChange={setReportsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Reports"
                      isActive={isReportsActive}
                      className="relative h-10 rounded-full px-3 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
                    >
                      <BarChart3 className="mr-2 size-5 opacity-70 transition-opacity group-data-[collapsible=icon]:mr-0 group-[[data-active=true]]/collapsible:opacity-100" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Reports
                      </span>
                      <ChevronRight className="ml-auto size-4 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 mt-1 rounded-xl border-none bg-sidebar-accent/5 p-1 shadow-inner group-data-[collapsible=icon]:hidden">
                      {visibleReportNavItems.map((item) => (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.url}
                            className="h-8 rounded-full px-2 text-sm font-medium transition-all hover:bg-sidebar-accent/60 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
                          >
                            <Link to={item.url}>
                              <item.icon className="mr-2 size-4 opacity-70" />
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

      <SidebarFooter className="p-4 pb-6 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
        <SidebarMenu>
          {hrmdoPortalUrl ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Back to AdU Live"
                  className="h-10 rounded-full px-4 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
                >
                  <a href={hrmdoPortalUrl}>
                    <ChevronLeft className="size-4 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Back to HRMDO Portal
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
            </>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-auto rounded-full border border-sidebar-border/30 bg-background/50 p-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-background hover:shadow-md group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0"
            >
              <Avatar className="size-10 rounded-full ring-2 ring-background transition-all group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:ring-0">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 font-medium text-primary group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-1 grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span
                  title={displayName}
                  className="truncate text-[13px] font-semibold tracking-tight text-sidebar-foreground"
                >
                  {displayName}
                </span>
                {email ? (
                  <span
                    title={email}
                    className="truncate text-[11px] font-medium text-sidebar-foreground/50"
                  >
                    {email}
                  </span>
                ) : null}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

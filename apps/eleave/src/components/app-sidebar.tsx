import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FileClock,
  FileText,
  ListOrdered,
  Mail,
  Settings2,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyEmployeeHrProfile } from "@/hooks/use-employee-hr-profile";
import { useForApprovalPendingCount } from "@/hooks/use-for-approval-pending-count";
import { useHrApprovalPendingCount } from "@/hooks/use-hr-approval-pending-count";
import {
  getAvatarUrlFromEmpNo,
  getInitialsFromDisplayName,
} from "@/lib/employee-teacher-display";
import { canAccessEleaveRoute } from "@/lib/eleave-route-access";
import { resolveDisplayName, resolveEmployeeNo } from "@/lib/fetch-auth-user";
import { resolveHrmdoPortalUrl } from "@/lib/resolve-adu-live-url";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

const navGroups: readonly NavGroup[] = [
  {
    label: "Leave",
    items: [
      { title: "Guidelines", url: "/guidelines", icon: BookOpen },
      { title: "My Leave", url: "/my-leave", icon: CalendarDays },
      { title: "For Approval", url: "/for-approval", icon: ClipboardCheck },
      { title: "HR Approval", url: "/hr-approval", icon: UserCheck },
    ],
  },
  {
    label: "Credits",
    items: [
      { title: "Beginning Balances", url: "/beginning-balances", icon: Wallet },
      { title: "Employee Leave Credits", url: "/employee-leave-credits", icon: CreditCard },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Leave Types", url: "/settings/leave-types", icon: ListOrdered },
      { title: "FL Cutoff Settings", url: "/settings/fl-cutoff", icon: Settings2 },
      { title: "Applicant Emails", url: "/settings/applicant-emails", icon: Mail },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Filed Leave", url: "/reports/filed-leave", icon: FileText },
      {
        title: "Filed Leave After Cutoff",
        url: "/reports/filed-leave-after-cutoff",
        icon: FileClock,
      },
    ],
  },
];

// The ring offset keeps focus visible on the active pill.
const navButtonClassName =
  "relative h-10 rounded-full px-3 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:hover:bg-primary/90 data-[active=true]:hover:text-primary-foreground group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0";

function formatPendingCountBadge(count: number): string {
  if (count > 99) {
    return "99+"
  }

  return String(count)
}

function isNavItemActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

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

  function canViewNavItem(url: string): boolean {
    return canAccessEleaveRoute(url, { user: authUser, profile: hrProfile });
  }

  const canViewForApproval = canViewNavItem("/for-approval");
  const canViewHrApproval = canViewNavItem("/hr-approval");
  const { data: forApprovalPendingCount = 0 } =
    useForApprovalPendingCount(canViewForApproval);
  const { data: hrApprovalPendingCount = 0 } =
    useHrApprovalPendingCount(canViewHrApproval);

  const pendingCountByUrl: Partial<Record<string, number>> = {
    "/for-approval": forApprovalPendingCount,
    "/hr-approval": hrApprovalPendingCount,
  };

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canViewNavItem(item.url)),
    }))
    .filter((group) => group.items.length > 0);
  const hrmdoPortalUrl = resolveHrmdoPortalUrl();

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
        {visibleNavGroups.map((group, groupIndex) => (
          <Fragment key={group.label}>
            {groupIndex > 0 ? (
              <SidebarSeparator className="mx-4 my-1 bg-sidebar-foreground/15 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
            ) : null}
            <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-1">
              <SidebarGroupLabel className="px-3 text-[11px] font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const pendingCount = pendingCountByUrl[item.url] ?? 0

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isNavItemActive(pathname, item.url)}
                          tooltip={
                            pendingCount > 0
                              ? `${item.title} (${formatPendingCountBadge(pendingCount)} pending)`
                              : item.title
                          }
                          className={navButtonClassName}
                        >
                          <Link to={item.url}>
                            <span className="relative mr-1 inline-flex shrink-0 group-data-[collapsible=icon]:mr-0">
                              <item.icon className="size-5 opacity-70 transition-opacity group-[[data-active=true]]:opacity-100" />
                              {pendingCount > 0 ? (
                                <span className="absolute -top-0.5 -right-0.5 hidden size-2 rounded-full bg-amber-500 ring-2 ring-white group-data-[collapsible=icon]:block dark:ring-slate-900" />
                              ) : null}
                            </span>
                            <span className="group-data-[collapsible=icon]:sr-only">
                              {item.title}
                              {pendingCount > 0 ? (
                                <span className="sr-only">
                                  {` (${formatPendingCountBadge(pendingCount)} pending)`}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        {pendingCount > 0 ? (
                          <SidebarMenuBadge
                            aria-hidden="true"
                            className={cn(
                              "bg-amber-100 text-amber-800 peer-hover/menu-button:text-amber-900 peer-data-[active=true]/menu-button:text-amber-900",
                              "!top-1/2 h-5 min-w-5 -translate-y-1/2 px-1.5 mr-2 leading-none",
                            )}
                          >
                            <span className="flex h-full w-full items-center justify-center leading-none">
                              {formatPendingCountBadge(pendingCount)}
                            </span>
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Fragment>
        ))}
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

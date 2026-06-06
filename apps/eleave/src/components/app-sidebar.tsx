import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const mainNavItems = [
  { title: "Guidelines", url: "/guidelines", icon: BookOpen },
  { title: "My Leave", url: "/my-leave", icon: CalendarDays },
  { title: "For Approval", url: "/for-approval", icon: ClipboardCheck },
  { title: "HR Approval", url: "/hr-approval", icon: UserCheck },
] as const;

const reportNavItems = [
  { title: "Filed Leave", url: "/reports/filed-leave", icon: FolderOpen },
] as const;

function isNavItemActive(pathname: string, url: string) {
  if (
    url === "/my-leave" ||
    url === "/for-approval" ||
    url === "/hr-approval"
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
                  <span className="text-base font-bold tracking-tight text-sidebar-foreground">
                    E-Leave
                  </span>
                  <span className="text-xs font-medium text-sidebar-foreground/50">
                    Employee Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 pt-2 group-data-[collapsible=icon]:px-2">
          <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.url)}
                    tooltip={item.title}
                    className="relative h-11 rounded-full px-4 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:hover:bg-primary/90 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
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
                      className="relative h-11 rounded-full px-4 font-medium transition-all duration-300 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0"
                    >
                      <BarChart3 className="mr-2 size-5 opacity-70 transition-opacity group-data-[collapsible=icon]:mr-0 group-[[data-active=true]]/collapsible:opacity-100" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Reports
                      </span>
                      <ChevronRight className="ml-auto size-4 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-5 mt-2 rounded-2xl border-none bg-sidebar-accent/5 p-2 shadow-inner group-data-[collapsible=icon]:hidden">
                      {reportNavItems.map((item) => (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.url}
                            className="h-9 rounded-full px-3 text-sm font-medium transition-all hover:bg-sidebar-accent/60 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pb-6 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-auto rounded-full border border-sidebar-border/30 bg-background/50 p-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-background hover:shadow-md group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0"
            >
              <Avatar className="size-10 rounded-full ring-2 ring-background transition-all group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:ring-0">
                <AvatarFallback className="bg-primary/10 font-medium text-primary group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:text-xs">
                  EL
                </AvatarFallback>
              </Avatar>
              <div className="ml-1 grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  Employee
                </span>
                <span className="truncate text-[11px] font-medium text-sidebar-foreground/50">
                  employee@adu.edu.ph
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

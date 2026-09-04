import { DrsThemeToggle } from '@/components/drs-theme-toggle.tsx';
import {
  DRS_STUDENT_APPLY_PERMISSION,
  getDrMaintenancePermissionForHost,
  getDrSubdomain,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { fetchWorkflowStageAccess } from '@/routes/-lib/api/fetchWorkflowStageAccess.ts';
import { loadMaintenanceAccess } from '@/routes/maintenance/-lib/loadMaintenanceAccess.ts';
import { checkPermission } from '@repo/hooks';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

const TENANT_LABEL: Record<string, string> = {
  'college-drs': 'College',
  'shs-drs': 'Senior High School',
  'bed-drs': 'Basic Education',
};

type NavItem = {
  label: string;
  to: string;
  /** Only highlight on an exact match for hub routes that own child pages. */
  exact?: boolean;
};

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Primary wayfinding for DRS. The shared AdU Live bar identifies the account;
 * this bar identifies where you are inside the document request system.
 */
export function DrsAppNav() {
  const permissionsQuery = useQuery({
    queryKey: ['drs-auth-permissions'],
    queryFn: async () => normalizePermissions((await fetchAuthUser()).data),
    staleTime: FIVE_MINUTES,
    retry: false,
  });

  const permissions = permissionsQuery.data ?? [];
  const maintenancePermission = getDrMaintenancePermissionForHost();
  const isStudent = checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION);
  const isMaintainer =
    maintenancePermission !== null &&
    checkPermission(permissions, maintenancePermission);

  const stageAccessQuery = useQuery({
    queryKey: ['drs-employee-workflow-stage-access'],
    queryFn: fetchWorkflowStageAccess,
    staleTime: FIVE_MINUTES,
    enabled: permissionsQuery.isSuccess && !isStudent,
  });

  const maintenanceAccessQuery = useQuery({
    queryKey: ['drs-maintenance-access'],
    queryFn: loadMaintenanceAccess,
    staleTime: FIVE_MINUTES,
    enabled: permissionsQuery.isSuccess && isMaintainer,
  });

  const maintenanceAccess = maintenanceAccessQuery.data?.access ?? [];
  const hasQueue = stageAccessQuery.data?.hasWorkflowStageAccess === true;

  const items: NavItem[] = [];

  if (isStudent) {
    items.push({ label: 'My requests', to: '/', exact: true });
    items.push({ label: 'Request a document', to: '/apply' });
  }

  if (hasQueue) {
    items.push({ label: 'Queue', to: '/staff/queue' });
  }

  if (isMaintainer) {
    items.push({ label: 'Configuration', to: '/maintenance', exact: true });

    if (maintenanceAccess.includes('reports')) {
      items.push({ label: 'Reports', to: '/maintenance/reports' });
    }

    if (maintenanceAccess.includes('access-debug')) {
      items.push({ label: 'Access debugger', to: '/maintenance/access-debug' });
    }
  }

  const tenant = TENANT_LABEL[getDrSubdomain(window.location.hostname)] ?? null;

  return (
    <nav
      aria-label="Document Request System"
      className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-14 z-30 border-b backdrop-blur print:hidden"
    >
      <div className="mx-auto flex h-11 w-full max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="hidden shrink-0 items-baseline gap-1.5 md:flex">
          <span className="text-sm font-semibold tracking-tight">
            Document Requests
          </span>
          {tenant ? (
            <span className="text-muted-foreground text-xs">{tenant}</span>
          ) : null}
        </div>

        <ul className="scrollbar-none -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1">
          {items.map((item) => (
            <li key={item.to} className="shrink-0">
              <Link
                to={item.to as never}
                activeOptions={{ exact: item.exact ?? false }}
                className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-7 items-center rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                activeProps={{
                  className: 'text-foreground bg-muted font-medium',
                  'aria-current': 'page',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <DrsThemeToggle />
      </div>
    </nav>
  );
}

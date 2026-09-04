import {
  DrsEmptyState,
  DrsLoadingState,
  DrsPageHeader,
  DrsPageShell,
} from '@/components/drs-ui.tsx';
import {
  DRS_STUDENT_APPLY_PERMISSION,
  getDrMaintenancePermissionForHost,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission, usePermission } from '@repo/hooks';
import { Button } from '@repo/ui/components/button';
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import { ApplicationsDataTable } from './-applications-datatable.tsx';
import { fetchWorkflowStageAccess } from './-lib/api/fetchWorkflowStageAccess.ts';
import { loadMaintenanceAccess } from './maintenance/-lib/loadMaintenanceAccess.ts';
import { MaintenanceHome } from './maintenance/-maintenance-home.tsx';
import type { MaintenanceLoaderAccess } from './maintenance/-maintenance-loader-data-context.tsx';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const maintPerm = getDrMaintenancePermissionForHost();
    const hasMaint =
      maintPerm !== null && checkPermission(permissions, maintPerm);

    if (hasMaint) {
      return;
    }

    const { hasWorkflowStageAccess } = await fetchWorkflowStageAccess();
    if (hasWorkflowStageAccess) {
      throw redirect({ to: '/staff/queue' });
    }
  },
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const hasCollege = checkPermission(
      permissions,
      DRS_STUDENT_APPLY_PERMISSION,
    );
    const maintPerm = getDrMaintenancePermissionForHost();
    const hasMaint =
      maintPerm !== null && checkPermission(permissions, maintPerm);

    let access: MaintenanceLoaderAccess = [];
    if (!hasCollege && hasMaint) {
      const m = await loadMaintenanceAccess();
      access = m.access;
    }

    return { permissions, access };
  },
  pendingComponent: () => <DrsLoadingState label="Loading your requests…" />,
  component: Index,
});

function Index() {
  const { permissions, access } = Route.useLoaderData();
  const { checkPermission: cp } = usePermission(permissions);
  const hasCollege = cp(DRS_STUDENT_APPLY_PERMISSION);
  const maintPerm = getDrMaintenancePermissionForHost();
  const hasMaint = maintPerm !== null && cp(maintPerm);

  if (hasCollege) {
    return (
      <DrsPageShell maxWidth="xl" contentClassName="space-y-5">
        <DrsPageHeader
          title="My requests"
          description="Track the documents you have requested from the registrar. Select a request to view its progress, pay, or send a message."
          actions={
            <Button asChild size="sm">
              <Link to="/apply">Request a document</Link>
            </Button>
          }
        />

        <ApplicationsDataTable />
      </DrsPageShell>
    );
  }

  if (hasMaint) {
    return <MaintenanceHome access={access} />;
  }

  return (
    <DrsPageShell
      maxWidth="sm"
      contentClassName="flex min-h-[60dvh] items-center"
    >
      <DrsEmptyState
        title="You do not have access to this DRS site"
        description="Document requests are opened per campus and per role. Ask the registrar's office to grant your account access to this site, or sign in with the account that has it."
        className="w-full"
      />
    </DrsPageShell>
  );
}

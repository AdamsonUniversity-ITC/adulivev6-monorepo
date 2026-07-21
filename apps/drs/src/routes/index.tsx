import {
  DrsEmptyState,
  DrsPageHeader,
  DrsPageShell,
  DrsSectionCard,
} from '@/components/drs-ui.tsx';
import {
  DRS_STUDENT_APPLY_PERMISSION,
  getDrMaintenancePermissionForHost,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission, usePermission } from '@repo/hooks';
import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import { FileText, ShieldCheck, Wrench } from 'lucide-react';
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
  pendingComponent: () => (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <Spinner />
    </div>
  ),
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
      <DrsPageShell maxWidth="xl" contentClassName="space-y-3">
        <DrsPageHeader
          eyebrow="Document Request System"
          title="My applications"
          description="Request documents, track stages, and message the registrar."
          actions={
            <>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/apply">
                  <FileText className="size-4" />
                  Apply
                </Link>
              </Button>

              {hasMaint ? (
                <Button
                  variant="outline"
                  asChild
                  size="sm"
                  className="rounded-full"
                >
                  <Link to="/maintenance">
                    <Wrench className="size-4" />
                    Maintenance
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />

        <DrsSectionCard
          title="Applications"
          description="Open a row for details, messages, payment, and edits when allowed."
          icon={FileText}
        >
          <section className="flex flex-col gap-2">
            <ApplicationsDataTable />
          </section>
        </DrsSectionCard>
      </DrsPageShell>
    );
  }

  if (hasMaint) {
    return (
      <div id="root" className="bg-background min-h-screen">
        <MaintenanceHome access={access} />
      </div>
    );
  }

  return (
    <DrsPageShell
      maxWidth="sm"
      contentClassName="flex min-h-[70dvh] items-center"
    >
      <DrsEmptyState
        icon={ShieldCheck}
        title="No DRS access"
        description="You do not have permission to use this DRS tenant. If you believe this is an error, contact your administrator."
      />
    </DrsPageShell>
  );
}

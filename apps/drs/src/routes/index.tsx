import {
  DrsEmptyState,
  DrsPageHeader,
  DrsPageShell,
  DrsSectionCard,
  DrsStatCard,
  DrsStatusBadge,
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
import {
  ClipboardCheck,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
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
      <DrsPageShell maxWidth="xl" contentClassName="space-y-6">
        <DrsPageHeader
          eyebrow="Document Request System"
          title="Your registrar requests, clearly organized."
          description="Request documents, follow every workflow stage, upload payment references, and keep conversations with the registrar in one secure workspace."
          actions={
            <>
              <Button asChild size="lg" className="rounded-full">
                <Link to="/apply">
                  <FileText className="size-4" />
                  Apply for documents
                </Link>
              </Button>

              {hasMaint ? (
                <Button
                  variant="outline"
                  asChild
                  size="lg"
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
          badges={
            <>
              <DrsStatusBadge tone="info">Online requests</DrsStatusBadge>
              <DrsStatusBadge tone="success">Status tracking</DrsStatusBadge>
              <DrsStatusBadge tone="warning">Payment updates</DrsStatusBadge>
            </>
          }
        />

        <section
          aria-label="DRS service highlights"
          className="grid gap-4 md:grid-cols-3"
        >
          <DrsStatCard
            label="Request"
            value="24/7"
            description="Build document requests anytime from the live catalog."
            icon={Sparkles}
            tone="blue"
          />
          <DrsStatCard
            label="Workflow"
            value="Live"
            description="Track stage movement, clearances, and payment state."
            icon={ClipboardCheck}
            tone="emerald"
          />
          <DrsStatCard
            label="Support"
            value="Threaded"
            description="Keep registrar messages attached to each application."
            icon={MessageSquareText}
            tone="amber"
          />
        </section>

        <DrsSectionCard
          title="Applications"
          description="Click a row to open request details, messages, payment references, and edits when the workflow allows them."
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

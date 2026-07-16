import { DrsLoadingState, DrsPageShell } from '@/components/drs-ui.tsx';
import { getDrMaintenancePermissionForHost } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ReportsPage } from './-reports/-reports-page.tsx';

export const Route = createFileRoute('/maintenance/reports')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const maint = getDrMaintenancePermissionForHost();
    if (!maint || !checkPermission(permissions, maint)) {
      throw redirect({ to: '/' });
    }
  },
  component: ReportsPage,
  pendingComponent: () => (
    <DrsPageShell maxWidth="xl">
      <DrsLoadingState label="Loading reports..." />
    </DrsPageShell>
  ),
});

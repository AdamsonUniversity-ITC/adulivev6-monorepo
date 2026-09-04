import { DrsLoadingState, DrsPageShell } from '@/components/drs-ui.tsx';
import { getDrMaintenancePermissionForHost } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AccessDebugPage } from './-access-debug-page.tsx';

export const Route = createFileRoute('/maintenance/access-debug')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const maint = getDrMaintenancePermissionForHost();
    if (!maint || !checkPermission(permissions, maint)) {
      throw redirect({ to: '/' });
    }
  },
  component: AccessDebugPage,
  pendingComponent: () => (
    <DrsPageShell maxWidth="xl">
      <DrsLoadingState label="Loading access debugger..." />
    </DrsPageShell>
  ),
});

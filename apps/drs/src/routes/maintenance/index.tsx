import { DrsLoadingState, DrsPageShell } from '@/components/drs-ui.tsx';
import { getDrMaintenancePermissionForHost } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { loadMaintenanceAccess } from './-lib/loadMaintenanceAccess.ts';
import { MaintenanceHome } from './-maintenance-home.tsx';

export const Route = createFileRoute('/maintenance/')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const maint = getDrMaintenancePermissionForHost();
    if (!maint || !checkPermission(permissions, maint)) {
      throw redirect({ to: '/' });
    }
  },
  loader: async () => loadMaintenanceAccess(),
  component: Index,
  pendingComponent: () => (
    <DrsPageShell maxWidth="md">
      <DrsLoadingState label="Loading maintenance access..." />
    </DrsPageShell>
  ),
});

function Index() {
  const { access } = Route.useLoaderData();
  return <MaintenanceHome access={access} />;
}

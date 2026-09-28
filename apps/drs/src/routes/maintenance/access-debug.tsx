import { DrsLoadingState, DrsPageShell } from '@/components/drs-ui.tsx';
import { hasDrsSuperAdminAccess } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AccessDebugPage } from './-access-debug-page.tsx';

export const Route = createFileRoute('/maintenance/access-debug')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (!hasDrsSuperAdminAccess(permissions)) {
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

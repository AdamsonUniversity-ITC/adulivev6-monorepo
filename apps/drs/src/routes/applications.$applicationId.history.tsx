import {
  DRS_STUDENT_APPLY_PERMISSION,
  hasDrAdminAccessForHost,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { ApplicationHistoryContent } from './staff.applications.$applicationId.history.tsx';

export const Route = createFileRoute('/applications/$applicationId/history')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const hasStudentAccess = checkPermission(
      permissions,
      DRS_STUDENT_APPLY_PERMISSION,
    );
    const hasAdminAccess =
      typeof window !== 'undefined' &&
      hasDrAdminAccessForHost(permissions, window.location.hostname);

    if (!hasStudentAccess && !hasAdminAccess) {
      throw redirect({ to: '/' });
    }
  },
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);

    return {
      canRestore:
        typeof window !== 'undefined' &&
        hasDrAdminAccessForHost(permissions, window.location.hostname),
    };
  },
  component: ApplicationHistoryPage,
});

function ApplicationHistoryPage() {
  const { applicationId } = Route.useParams();
  const { canRestore } = Route.useLoaderData();

  return (
    <ApplicationHistoryContent
      applicationId={applicationId}
      canRestore={canRestore}
      backTo="student"
    />
  );
}

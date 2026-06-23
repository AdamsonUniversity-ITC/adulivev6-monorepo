import {
  hasDrAdminAccessForHost,
  isStudentOnlyDrsPortalUser,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { redirect } from '@tanstack/react-router';

import { fetchWorkflowStageAccess } from './api/fetchWorkflowStageAccess.ts';

/**
 * Staff queue and workbench routes require maintenance access or workflow-stage
 * assignment. Student-only portal users and unassigned staff are sent home.
 */
export async function assertStaffPortalAccess(): Promise<void> {
  const { data } = await fetchAuthUser();
  const permissions = normalizePermissions(data);
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  if (isStudentOnlyDrsPortalUser(permissions, hostname)) {
    throw redirect({ to: '/' });
  }

  if (hasDrAdminAccessForHost(permissions, hostname)) {
    return;
  }

  const { hasWorkflowStageAccess } = await fetchWorkflowStageAccess();
  if (!hasWorkflowStageAccess) {
    throw redirect({ to: '/' });
  }
}

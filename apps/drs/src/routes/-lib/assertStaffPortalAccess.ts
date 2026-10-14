import {
  hasDrCmsAccessForHost,
  isStudentOnlyDrsPortalUser,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { redirect } from '@tanstack/react-router';

import { fetchReportAccess } from '@/api/reports.ts';

import { fetchWorkflowStageAccess } from './api/fetchWorkflowStageAccess.ts';

/**
 * Staff queue and workbench routes require CMS access (subdomain Administrator
 * or Super Admin) or workflow-stage assignment. Student-only portal users and
 * unassigned staff are sent home.
 */
export async function assertStaffPortalAccess(): Promise<void> {
  const { data } = await fetchAuthUser();
  const permissions = normalizePermissions(data);
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  if (isStudentOnlyDrsPortalUser(permissions, hostname)) {
    throw redirect({ to: '/' });
  }

  if (hasDrCmsAccessForHost(permissions, hostname)) {
    return;
  }

  const { hasWorkflowStageAccess } = await fetchWorkflowStageAccess();
  if (!hasWorkflowStageAccess) {
    throw redirect({ to: '/' });
  }
}

/**
 * Reports are limited to a host administrator or an employee on the tenant
 * report viewer list. A staff queue alone does not open this page.
 */
export async function assertReportPageAccess(): Promise<void> {
  const { data } = await fetchAuthUser();
  const permissions = normalizePermissions(data);
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  if (isStudentOnlyDrsPortalUser(permissions, hostname)) {
    throw redirect({ to: '/' });
  }

  if (hasDrCmsAccessForHost(permissions, hostname)) {
    return;
  }

  const { can_view } = await fetchReportAccess();
  if (!can_view) {
    throw redirect({ to: '/' });
  }
}

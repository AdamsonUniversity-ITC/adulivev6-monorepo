import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachWorkflowUser = async ({
  assignmentUserId,
  assignmentId,
  empNo,
  assignmentRole = 'primary',
}: {
  assignmentUserId?: string;
  assignmentId?: string;
  empNo?: string;
  assignmentRole?: string;
}): Promise<void> => {
  // Prefer primary-key detach used by user-management responsibilities.
  if (assignmentUserId && /^\d+$/.test(assignmentUserId)) {
    await registrarSvc.delete(
      `v1/drs/workflow/assignment-users/${encodeURIComponent(assignmentUserId)}`,
    );
    return;
  }

  if (!assignmentId || !empNo) {
    throw new Error('Assignment id and employee number are required.');
  }

  const role = encodeURIComponent(assignmentRole);
  await registrarSvc.delete(
    `v1/drs/workflow/assignments/${encodeURIComponent(assignmentId)}/users/${encodeURIComponent(empNo)}?assignment_role=${role}`,
  );
};

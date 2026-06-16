import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachWorkflowUser = async ({
  assignmentId,
  empNo,
  assignmentRole = 'primary',
}: {
  assignmentId: string;
  empNo: string;
  assignmentRole?: string;
}): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/workflow/assignments/${encodeURIComponent(assignmentId)}/users/${encodeURIComponent(empNo)}`,
    {
      params: {
        assignment_role: assignmentRole,
      },
    },
  );
};

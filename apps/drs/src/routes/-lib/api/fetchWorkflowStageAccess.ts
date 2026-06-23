import { registrarSvc } from '@repo/axios-config/registrar-service';

export type WorkflowStageAccess = {
  hasWorkflowStageAccess: boolean;
  stageSlugs: string[];
};

const EMPTY: WorkflowStageAccess = {
  hasWorkflowStageAccess: false,
  stageSlugs: [],
};

export async function fetchWorkflowStageAccess(): Promise<WorkflowStageAccess> {
  try {
    const { data: body } = await registrarSvc.get<unknown>(
      'v1/drs/employee/me/workflow-stage-access',
    );

    if (!body || typeof body !== 'object') {
      return EMPTY;
    }

    const record = body as Record<string, unknown>;
    const data =
      record.data && typeof record.data === 'object'
        ? (record.data as Record<string, unknown>)
        : null;

    if (!data) {
      return EMPTY;
    }

    const stageSlugs = Array.isArray(data.stage_slugs)
      ? data.stage_slugs.filter(
          (slug): slug is string => typeof slug === 'string',
        )
      : [];

    return {
      hasWorkflowStageAccess: data.has_workflow_stage_access === true,
      stageSlugs,
    };
  } catch {
    return EMPTY;
  }
}

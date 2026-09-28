import { registrarSvc } from '@repo/axios-config/registrar-service';
import type {
  EmailNotificationCondition,
  EmailNotificationTargetType,
  WorkflowTaskKind,
} from './types.ts';

export type EmailNotificationPayload = {
  name: string;
  target_type: EmailNotificationTargetType;
  drs_workflow_stage_id?: string | number | null;
  task_kind?: WorkflowTaskKind | null;
  condition: EmailNotificationCondition;
  notify_student: boolean;
  notify_staff: boolean;
  subject: string;
  body_html: string;
  is_enabled?: boolean;
};

export const createEmailNotificationConfig = async (
  payload: EmailNotificationPayload,
) => {
  const { data } = await registrarSvc.post(
    'v1/drs/workflow/email-notifications',
    payload,
  );
  return data;
};

export const updateEmailNotificationConfig = async (
  configId: string | number,
  payload: Partial<EmailNotificationPayload>,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/email-notifications/${configId}`,
    payload,
  );
  return data;
};

export const deleteEmailNotificationConfig = async (
  configId: string | number,
) => {
  await registrarSvc.delete(`v1/drs/workflow/email-notifications/${configId}`);
};

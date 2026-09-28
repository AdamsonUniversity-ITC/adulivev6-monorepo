import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { EmailNotificationConfig } from './types.ts';

const unwrapList = (response: unknown): EmailNotificationConfig[] => {
  if (Array.isArray(response)) {
    return response as EmailNotificationConfig[];
  }
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: EmailNotificationConfig[] }).data;
  }
  return [];
};

export const fetchEmailNotificationConfigs = async (params?: {
  stage_id?: string | number;
  task_kind?: string;
}): Promise<EmailNotificationConfig[]> => {
  const { data } = await registrarSvc.get(
    'v1/drs/workflow/email-notifications',
    { params },
  );
  return unwrapList(data);
};

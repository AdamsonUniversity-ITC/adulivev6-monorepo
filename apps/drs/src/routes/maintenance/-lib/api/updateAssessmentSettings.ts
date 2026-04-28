import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { AssessmentSettings } from './fetchAssessmentSettings.ts';

const unwrap = (body: unknown): AssessmentSettings | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if ('data' in body && body.data && typeof body.data === 'object') {
    return body.data as AssessmentSettings;
  }

  return body as AssessmentSettings;
};

export const updateAssessmentSettings = async (payload: {
  auto_complete_price: boolean;
}): Promise<AssessmentSettings | null> => {
  const { data } = await registrarSvc.patch<unknown>(
    `v1/drs/assessment-settings`,
    payload,
  );

  return unwrap(data);
};

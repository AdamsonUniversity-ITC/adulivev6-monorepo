import { registrarSvc } from '@repo/axios-config/registrar-service';

export type AssessmentAllowedUser = {
  emp_no: string;
  name?: string | null;
  email?: string | null;
  position?: string | null;
  department?: string | null;
  role?: string | null;
};

export type AssessmentSettings = {
  id: number;
  auto_complete_price: boolean;
  users: AssessmentAllowedUser[];
};

const unwrap = (body: unknown): AssessmentSettings | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if ('data' in body && body.data && typeof body.data === 'object') {
    return body.data as AssessmentSettings;
  }

  return body as AssessmentSettings;
};

export const fetchAssessmentSettings = async (): Promise<AssessmentSettings | null> => {
  const { data } = await registrarSvc.get<unknown>(`v1/drs/assessment-settings`);
  return unwrap(data);
};

import { registrarSvc } from '@repo/axios-config/registrar-service';

export type AssessmentUserSearchHit = {
  id: number;
  name: string | null;
  email: string | null;
};

export const searchAssessmentUsers = async (
  q: string,
): Promise<AssessmentUserSearchHit[]> => {
  const { data } = await registrarSvc.get<{
    data?: AssessmentUserSearchHit[];
  }>(`v1/drs/assessment-settings/user-search`, { params: { q } });

  return Array.isArray(data?.data) ? data.data : [];
};

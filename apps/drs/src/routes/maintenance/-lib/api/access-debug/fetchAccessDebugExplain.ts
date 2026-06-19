import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { AccessDebugExplainResponse } from './types.ts';

export const fetchAccessDebugExplain = async ({
  empNo,
  application,
}: {
  empNo: string;
  application?: string;
}): Promise<AccessDebugExplainResponse['data']> => {
  const { data } = await registrarSvc.get<AccessDebugExplainResponse>(
    'v1/drs/access-debug/explain',
    {
      params: {
        emp_no: empNo,
        application: application?.trim() || undefined,
      },
    },
  );

  return data.data;
};

import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSEmployeeFlagDefinition } from '../types/flag-definitions.ts';
import type { FlagIconName } from '../flag-icons.ts';

export async function postFlagDefinition(payload: {
  label: string;
  icon: FlagIconName;
}): Promise<DRSEmployeeFlagDefinition> {
  const { data: body } = await registrarSvc.post<{ data: DRSEmployeeFlagDefinition }>(
    'v1/drs/employee/flag-definitions',
    payload,
  );

  return body.data;
}

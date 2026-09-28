import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSEmployeeFlagDefinition } from '../types/flag-definitions.ts';
import type { FlagIconName } from '../flag-icons.ts';

export async function patchFlagDefinition(
  id: string,
  payload: Partial<{
    label: string;
    icon: FlagIconName;
    position: number;
  }>,
): Promise<DRSEmployeeFlagDefinition> {
  const { data: body } = await registrarSvc.patch<{ data: DRSEmployeeFlagDefinition }>(
    `v1/drs/employee/flag-definitions/${encodeURIComponent(id)}`,
    payload,
  );

  return body.data;
}

import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSEmployeeFlagDefinition } from '../types/flag-definitions.ts';

export async function fetchFlagDefinitions(): Promise<
  DRSEmployeeFlagDefinition[]
> {
  const { data: body } = await registrarSvc.get<{ data: DRSEmployeeFlagDefinition[] }>(
    'v1/drs/employee/flag-definitions',
  );

  return body.data ?? [];
}

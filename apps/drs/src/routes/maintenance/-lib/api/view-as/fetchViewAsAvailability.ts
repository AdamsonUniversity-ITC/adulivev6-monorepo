import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ViewAsAvailability = {
  enabled: boolean;
};

export async function fetchViewAsAvailability(): Promise<ViewAsAvailability> {
  const { data } = await registrarSvc.get<ViewAsAvailability>('v1/drs/view-as');
  return data;
}

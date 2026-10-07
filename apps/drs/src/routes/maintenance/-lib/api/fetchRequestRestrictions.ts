import { registrarSvc } from '@repo/axios-config/registrar-service';

export type RequestRestrictions = {
  block_while_unpaid: boolean;
};

const unwrap = (response: unknown): RequestRestrictions => {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data: unknown }).data === 'object'
  ) {
    const data = (response as { data: Record<string, unknown> }).data;
    return {
      block_while_unpaid: Boolean(data.block_while_unpaid),
    };
  }

  return { block_while_unpaid: false };
};

export const fetchRequestRestrictions =
  async (): Promise<RequestRestrictions> => {
    const { data } = await registrarSvc.get('v1/drs/request-restrictions');
    return unwrap(data);
  };

export const updateRequestRestrictions = async (
  blockWhileUnpaid: boolean,
): Promise<RequestRestrictions> => {
  const { data } = await registrarSvc.patch('v1/drs/request-restrictions', {
    block_while_unpaid: blockWhileUnpaid,
  });
  return unwrap(data);
};

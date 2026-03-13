import { registrarSvc } from '@repo/axios-config';

export const getAccess = ({ user_id }: { user_id: number }) => {
  return registrarSvc.get(`/v1/drs/access`, {
    params: {
      user: user_id,
    },
  });
};

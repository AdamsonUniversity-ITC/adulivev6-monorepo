import { authSvc } from '@repo/axios-config';
export const useAuth = () => {
  const check = async () => {
    return await authSvc.get('user');
  };

  return {
    check,
  };
};

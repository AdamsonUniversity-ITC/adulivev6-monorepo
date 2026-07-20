import { authSvc, buildLogoutRedirectUrl } from '@repo/axios-config';
import { useCallback } from 'react';

export type AuthUserInfo = {
  id?: number | string | null;
  fname?: string | null;
  lname?: string | null;
  mname?: string | null;
  emailadd?: string | null;
  emp_no?: string | null;
  student_no?: string | null;
  [key: string]: unknown;
};

export type AuthUser = {
  id?: number;
  username?: string;
  email?: string;
  permissions?: string[];
  roles?: string[];
  image_id?: number | string | null;
  user_info?: AuthUserInfo | null;
  [key: string]: unknown;
};

export const useAuth = () => {
  const check = useCallback(async () => {
    return await authSvc.get<AuthUser>('user');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authSvc.post('token/logout');
    } catch {
      // Still leave the app; cookie/session may already be gone.
    }
    window.location.assign(buildLogoutRedirectUrl());
  }, []);

  return {
    check,
    logout,
  };
};

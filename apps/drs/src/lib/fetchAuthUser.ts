import { authSvc } from '@repo/axios-config';

export const DRS_AUTH_USER_QUERY_KEY = ['drs-auth-user'] as const;

export type AuthUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  permissions?: string[];
  user_info?: {
    fname?: string | null;
    lname?: string | null;
    emp_no?: string | null;
  } | null;
  view_as?: {
    actor_id: number;
    actor_name: string | null;
    target_user_id: number;
  } | null;
  [key: string]: unknown;
};

let inflight: ReturnType<typeof authSvc.get<AuthUser>> | null = null;

/** Drop a shared in-flight GET /user so the next call follows the view-as header. */
export function resetFetchAuthUser(): void {
  inflight = null;
}

/**
 * Dedupes concurrent GET /user calls (e.g. multiple route beforeLoads on first load).
 */
export function fetchAuthUser() {
  if (!inflight) {
    inflight = authSvc.get<AuthUser>('user').finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function normalizePermissions(data: AuthUser): string[] {
  const p = data.permissions;
  return Array.isArray(p) ? (p as string[]) : [];
}

import { authSvc } from '@repo/axios-config';

export type AuthUser = {
  id: number;
  permissions?: string[];
  [key: string]: unknown;
};

let inflight: ReturnType<typeof authSvc.get<AuthUser>> | null = null;

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

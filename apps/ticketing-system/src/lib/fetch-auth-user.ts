import { authSvc } from "@repo/axios-config/auth-service";

export type AuthUser = {
  id?: number;
  username?: string;
  email?: string;
  permissions?: string[];
  [key: string]: unknown;
};

let inflight: ReturnType<typeof authSvc.get<AuthUser>> | null = null;

/** Dedupes concurrent GET /user calls (e.g. root beforeLoad + AuthLayout). */
export function fetchAuthUser() {
  if (!inflight) {
    inflight = authSvc.get<AuthUser>("user").finally(() => {
      inflight = null;
    });
  }

  return inflight;
}

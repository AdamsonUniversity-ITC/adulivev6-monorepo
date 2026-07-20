import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { authUserQueryOptions } from "@/lib/auth-queries";
import {
  isBoardAdminCapability,
  isSuperAdmin,
  normalizePermissions,
} from "@/lib/aduts-access";
import { isPlatformHost } from "@/lib/adutsHost";

export async function requireSuperAdmin(queryClient: QueryClient) {
  if (!isPlatformHost()) {
    throw redirect({ to: "/" });
  }

  const user = await queryClient.ensureQueryData(authUserQueryOptions);
  const permissions = normalizePermissions(user);

  if (!isSuperAdmin(permissions)) {
    throw redirect({ to: "/" });
  }
}

export async function requireBoardAdminCapability(queryClient: QueryClient) {
  if (isPlatformHost()) {
    throw redirect({ to: "/" });
  }

  const user = await queryClient.ensureQueryData(authUserQueryOptions);
  const permissions = normalizePermissions(user);

  if (!isBoardAdminCapability(permissions)) {
    throw redirect({ to: "/" });
  }
}

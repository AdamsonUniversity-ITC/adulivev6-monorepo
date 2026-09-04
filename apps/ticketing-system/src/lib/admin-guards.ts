import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { fetchCurrentBoard } from "@/lib/aduts-api";
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

export async function requireReportsAccess(queryClient: QueryClient) {
  if (isPlatformHost()) {
    throw redirect({ to: "/" });
  }

  const board = await queryClient.ensureQueryData({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  if (!board.access?.can_view_reports) {
    throw redirect({ to: "/" });
  }
}

export async function requireSectionHeadOrBoardAdmin(queryClient: QueryClient) {
  if (isPlatformHost()) {
    throw redirect({ to: "/" });
  }

  const board = await queryClient.ensureQueryData({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  if (
    board.access?.is_board_admin === true ||
    board.access?.is_section_head === true
  ) {
    return;
  }

  throw redirect({ to: "/" });
}

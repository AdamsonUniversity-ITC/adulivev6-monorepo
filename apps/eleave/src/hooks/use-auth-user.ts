import { useQuery } from "@tanstack/react-query"

import { authUserQueryOptions } from "@/lib/auth-queries"

export function useAuthUser() {
  return useQuery(authUserQueryOptions)
}

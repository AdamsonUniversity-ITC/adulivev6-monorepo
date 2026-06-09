import { useQuery } from "@tanstack/react-query"

import {
  fetchBeginningBalances,
  type BeginningBalanceListParams,
} from "@/lib/beginning-balances-api"

export function useBeginningBalances(params: BeginningBalanceListParams) {
  return useQuery({
    queryKey: ["beginning-balances", params],
    queryFn: () => fetchBeginningBalances(params),
  })
}

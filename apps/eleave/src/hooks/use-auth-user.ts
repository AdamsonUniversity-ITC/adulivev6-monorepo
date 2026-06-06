import { useQuery } from "@tanstack/react-query"

import { fetchAuthUser } from "@/lib/fetch-auth-user"

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const response = await fetchAuthUser()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

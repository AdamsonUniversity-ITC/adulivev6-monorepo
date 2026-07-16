import { fetchMyEmployeeHrProfile } from "@/lib/employee-hr-profile-api"
import { fetchAuthUser } from "@/lib/fetch-auth-user"

export const authUserQueryOptions = {
  queryKey: ["auth-user"] as const,
  queryFn: async () => (await fetchAuthUser()).data,
  staleTime: 5 * 60 * 1000,
}

export const myHrProfileQueryOptions = {
  queryKey: ["employee-hr-profile", "me"] as const,
  queryFn: fetchMyEmployeeHrProfile,
  staleTime: 5 * 60 * 1000,
}

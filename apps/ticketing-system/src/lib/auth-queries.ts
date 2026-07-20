import { fetchAuthUser } from "@/lib/fetch-auth-user";

export const authUserQueryOptions = {
  queryKey: ["auth-user"] as const,
  queryFn: async () => (await fetchAuthUser()).data,
  staleTime: 5 * 60 * 1000,
};

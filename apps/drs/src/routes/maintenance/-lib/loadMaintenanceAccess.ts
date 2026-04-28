import { getAccess } from '@/api/getAccess.ts';
import { fetchAuthUser } from '@/lib/fetchAuthUser.ts';

export async function loadMaintenanceAccess() {
  const { data } = await fetchAuthUser();
  const result = await getAccess({ user_id: data.id });
  const raw = result.data?.access;
  const access = Array.isArray(raw) ? (raw as string[]) : ([] as string[]);

  return {
    access,
  };
}

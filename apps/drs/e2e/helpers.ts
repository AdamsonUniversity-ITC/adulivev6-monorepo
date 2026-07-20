import type { Page } from '@playwright/test';

/** DRS tenant host; must match registrar DRSTenantContextMiddleware slug. */
export const appOrigin =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://college-drs.localhost.test:5173';

export const authApi = 'http://auth-api.localhost.test:8002/api/user';
export const registrarApi = 'http://registrar-api.localhost.test:8001/api';

export const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers':
    'accept, content-type, x-requested-with, x-xsrf-token',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-allow-origin': appOrigin,
};

export async function fulfillOptions(
  route: Parameters<Page['route']>[1] extends (route: infer R) => unknown
    ? R
    : never,
) {
  await route.fulfill({ headers: corsHeaders, status: 204 });
}

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

export async function mockOnboardingCompleted(page: Page) {
  await page.route(`${registrarApi}/v1/drs/onboarding**`, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await fulfillOptions(route);
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        data: {
          completed: true,
          completed_at: '2026-01-01T00:00:00Z',
        },
      },
    });
  });
}

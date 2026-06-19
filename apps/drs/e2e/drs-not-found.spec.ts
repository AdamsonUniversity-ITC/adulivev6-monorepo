import { expect, test, type Page } from '@playwright/test';

const authApi = 'http://auth-api.localhost.test:8002/api/user';
const appOrigin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers':
    'accept, content-type, x-requested-with, x-xsrf-token',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-allow-origin': appOrigin,
};

async function fulfillOptions(
  route: Parameters<Page['route']>[1] extends (route: infer R) => unknown
    ? R
    : never,
) {
  await route.fulfill({ headers: corsHeaders, status: 204 });
}

async function mockAuthUser(page: Page, permissions: string[]) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 42,
        name: 'DRS Student',
        permissions,
      },
    });
  });
}

test.describe('DRS not found page', () => {
  test('shows branded page for unknown routes', async ({ page }) => {
    await mockAuthUser(page, ['college-access']);

    await page.goto('/this-route-does-not-exist');

    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to DRS home' }),
    ).toBeVisible();
  });
});

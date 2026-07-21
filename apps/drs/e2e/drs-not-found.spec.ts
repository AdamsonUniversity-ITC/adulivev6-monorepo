import { expect, test, type Page } from '@playwright/test';
import { authApi, corsHeaders, fulfillOptions } from './helpers.ts';

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
      page.getByText('Page not found', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to DRS home' }),
    ).toBeVisible();
  });
});

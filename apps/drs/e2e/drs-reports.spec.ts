import { expect, test, type Page } from '@playwright/test';
import {
  authApi,
  corsHeaders,
  fulfillOptions,
  registrarApi,
} from './helpers.ts';

async function mockMaintenanceUser(page: Page) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 7,
        name: 'DRS Admin',
        permissions: ['drs_college_maintenance_access'],
      },
    });
  });

  await page.route(`${registrarApi}/v1/drs/access**`, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: { access: ['reports'] },
    });
  });
}

async function mockStudentUser(page: Page) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 3,
        name: 'Student User',
        permissions: ['college-access'],
      },
    });
  });
}

async function mockSummaryReport(page: Page) {
  await page.route(`${registrarApi}/v1/drs/reports/**`, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    const url = route.request().url();

    if (url.includes('/export')) {
      await route.fulfill({
        headers: {
          ...corsHeaders,
          'content-disposition': 'attachment; filename="drs-summary.xlsx"',
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: Buffer.from('mock-xlsx'),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        data: {
          total: 12,
          active: 5,
          released: 4,
          cancelled: 2,
          disposed: 1,
        },
      },
    });
  });
}

test.describe('DRS reports page', () => {
  test('maintenance user can open reports page', async ({ page }) => {
    await mockMaintenanceUser(page);
    await mockSummaryReport(page);

    await page.goto('/maintenance/reports');

    await expect(
      page.getByRole('heading', { name: 'Statistical reports' }),
    ).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();
  });

  test('non-maintenance user is redirected away from reports', async ({
    page,
  }) => {
    await mockStudentUser(page);

    await page.goto('/maintenance/reports');

    await expect(page).not.toHaveURL(/\/maintenance\/reports$/);
  });
});

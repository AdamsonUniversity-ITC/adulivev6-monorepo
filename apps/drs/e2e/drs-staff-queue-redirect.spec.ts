import { expect, test, type Page } from '@playwright/test';
import {
  authApi,
  corsHeaders,
  fulfillOptions,
  registrarApi,
} from './helpers.ts';

type MockHomeRedirectOptions = {
  permissions: string[];
  hasWorkflowStageAccess: boolean;
};

async function mockHomeRedirectApis(
  page: Page,
  options: MockHomeRedirectOptions,
) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 42,
        name: 'DRS Staff',
        permissions: options.permissions,
      },
    });
  });

  await page.route(
    `${registrarApi}/v1/drs/employee/me/workflow-stage-access`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: {
            has_workflow_stage_access: options.hasWorkflowStageAccess,
            stage_slugs: options.hasWorkflowStageAccess ? ['pending'] : [],
          },
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/employee/applications**`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: [],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
          },
        },
      });
    },
  );

  await page.route(`${registrarApi}/v1/drs/access**`, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: { access: ['user-management', 'workflow'] },
    });
  });
}

test.describe('DRS home staff queue redirect', () => {
  test('redirects assigned staff from home to staff queue', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: ['drs_regular_user_access'],
      hasWorkflowStageAccess: true,
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/staff\/queue$/);
    await expect(
      page.getByRole('heading', { name: 'Workflow queue' }),
    ).toBeVisible();
  });

  test('keeps unassigned staff on home with no access state', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: ['teacher-access'],
      hasWorkflowStageAccess: false,
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('No DRS access', { exact: true }),
    ).toBeVisible();
  });

  test('does not redirect maintenance users with workflow assignment', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: [
        'drs_college_maintenance_access',
        'drs_regular_user_access',
      ],
      hasWorkflowStageAccess: true,
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Maintenance command center' }),
    ).toBeVisible();
  });

  test('redirects unassigned staff away from direct staff queue URL', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: ['teacher-access'],
      hasWorkflowStageAccess: false,
    });

    await page.goto('/staff/queue');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('No DRS access', { exact: true }),
    ).toBeVisible();
  });

  test('redirects student-only users away from direct staff application URL', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: ['college-access'],
      hasWorkflowStageAccess: false,
    });

    await page.goto('/staff/applications/00000000-0000-4000-8000-000000000001');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('Your registrar requests, clearly organized.'),
    ).toBeVisible();
  });

  test('shows error state when staff application detail returns forbidden', async ({
    page,
  }) => {
    await mockHomeRedirectApis(page, {
      permissions: ['drs_regular_user_access'],
      hasWorkflowStageAccess: true,
    });

    const applicationId = '00000000-0000-4000-8000-000000000099';

    await page.route(
      `${registrarApi}/v1/drs/employee/applications/${applicationId}`,
      async (route) => {
        if (route.request().method() === 'OPTIONS')
          return fulfillOptions(route);

        await route.fulfill({
          contentType: 'application/json',
          headers: corsHeaders,
          status: 403,
          json: { message: 'Forbidden.' },
        });
      },
    );

    await page.goto(`/staff/applications/${applicationId}`);

    await expect(page).toHaveURL(
      new RegExp(`/staff/applications/${applicationId}$`),
    );
    await expect(
      page.getByText('Could not load this application', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Request #')).not.toBeVisible();
  });
});

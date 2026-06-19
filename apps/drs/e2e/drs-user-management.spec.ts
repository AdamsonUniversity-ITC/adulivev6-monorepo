import { expect, test, type Page } from '@playwright/test';

const authApi = 'http://auth-api.localhost.test:8002/api/user';
const registrarApi = 'http://registrar-api.localhost.test:8001/api';
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

async function mockUserManagementApis(page: Page) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 7,
        name: 'DRS Admin',
        permissions: [
          'drs_college_maintenance_access',
          'drs_user_management_manage',
        ],
      },
    });
  });

  await page.route(`${registrarApi}/v1/drs/access**`, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: { access: ['user-management', 'workflow'] },
    });
  });

  await page.route(
    `${registrarApi}/v1/drs/user-management/users**`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: [
            {
              emp_no: 'EMP-1',
              user_id: 101,
              name: 'Ada Registrar',
              email: 'ada@example.test',
              department: 'Registrar',
              position: 'Staff',
              responsibility_summary: {
                total: 0,
                by_role: {},
                by_target: {},
              },
            },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
          },
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/user-management/users/EMP-1`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: {
            employee: {
              emp_no: 'EMP-1',
              user_id: 101,
              name: 'Ada Registrar',
              email: 'ada@example.test',
              department: 'Registrar',
              position: 'Staff',
            },
            roles: ['Regular User'],
            permissions: ['drs_regular_user_access'],
            responsibility_summary: {
              total: 0,
              by_role: {},
              by_target: {},
            },
            responsibilities: [],
          },
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/user-management/users/EMP-1/history`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: { data: [] },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/user-management/users/EMP-1/permissions`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: {
            employee: {
              emp_no: 'EMP-1',
              user_id: 101,
              name: 'Ada Registrar',
              email: 'ada@example.test',
              department: 'Registrar',
              position: 'Staff',
            },
            roles: ['Regular User'],
            permissions: ['drs_regular_user_access', 'drs_cancel_applications'],
            responsibility_summary: {
              total: 0,
              by_role: {},
              by_target: {},
            },
            responsibilities: [],
          },
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/workflow/task-kinds`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: [
            {
              kind: 'processing',
              label: 'Processing',
              description: 'Document processing',
              requires_clearance: false,
              config_schema: {},
            },
          ],
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/clearance-departments`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: [
            {
              id: 10,
              clearance_name: 'Registrar Clearance',
              users: [],
            },
          ],
        },
      });
    },
  );

  await page.route(
    `${registrarApi}/v1/drs/assessment-settings`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: {
            id: 20,
            auto_complete_price: false,
            users: [],
            foreigner_access_users: [],
          },
        },
      });
    },
  );

  await page.route(`${registrarApi}/v1/drs/workflow/stages`, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        data: [
          {
            id: '30',
            name: 'For Processing',
            slug: 'for-processing',
            position: 1,
            is_initial: false,
            is_terminal: false,
            color: null,
            transition_rule: 'all_required_done',
            tasks: [
              {
                id: '31',
                drs_workflow_stage_id: '30',
                name: 'Verify Payment',
                slug: 'verify-payment',
                kind: 'payment_verification',
                is_required: true,
                position: 1,
                parallel_group: null,
                drs_clearance_id: null,
                config_json: null,
              },
            ],
          },
        ],
      },
    });
  });

  await page.route(
    `${registrarApi}/v1/drs/workflow/assignments`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        status: 201,
        json: {
          data: {
            id: '1',
            emp_no: 'EMP-1',
            assignment_role: 'primary',
            sequence: 0,
            status: 'active',
            metadata: {},
          },
        },
      });
    },
  );
}

test('admin can open DRS user management and start an assignment', async ({
  page,
}) => {
  await mockUserManagementApis(page);
  await page.goto(`${appOrigin}/maintenance`);

  await page.getByText('User management').click();
  await expect(page.getByText('Ada Registrar')).toBeVisible();

  await page.getByText('Ada Registrar').click();
  await expect(page.getByText('Regular User')).toBeVisible();
  await expect(page.getByLabel('Can cancel applications')).toBeVisible();

  await page.getByRole('button', { name: /assign/i }).click();
  await expect(page.getByText('Clearance department')).toBeVisible();
  await expect(page.getByText('Assessment assessor')).toBeVisible();
  await expect(page.getByText('Payment verification')).toBeVisible();
  await page.getByRole('combobox').first().click();
  await page.getByText('Payment verification').click();
  await page.getByRole('button', { name: /save assignment/i }).click();
  await expect(page.getByText('Assignment saved.')).toBeVisible();
});

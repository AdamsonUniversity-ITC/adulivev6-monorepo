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

async function mockStudentApplicationApis(
  page: Page,
  options: { mayCancel: boolean },
) {
  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 10,
        name: 'Student User',
        permissions: ['college-access'],
      },
    });
  });

  await page.route(
    `${registrarApi}/v1/drs/applications/app-1`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') return fulfillOptions(route);

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        json: {
          data: {
            id: 'app-1',
            drs_no: '1001',
            student_no: 'S10',
            student_name: 'Student User',
            course_id: 'BSCS',
            school_year: '2026-2027',
            semester: 'first',
            contact_no: '09171234567',
            email: 'student@example.test',
            receive_mode: 'pickup',
            delivery_address: null,
            delivery_tracking_number: null,
            purpose: null,
            remarks: null,
            is_paid: false,
            is_cancelled: false,
            disposed_at: null,
            is_foreigner_student: false,
            release_date: null,
            date_released: null,
            cleared: null,
            status: 'pending',
            editable: true,
            may_cancel: options.mayCancel,
            current_stage: {
              id: '1',
              name: 'Pending',
              slug: 'pending',
              position: 1,
              is_terminal: false,
            },
            lines: [],
            clearances: [],
            created_at: '2026-06-18T00:00:00+00:00',
            updated_at: '2026-06-18T00:00:00+00:00',
          },
        },
      });
    },
  );
}

test('student cancel button is visible only when may_cancel is true', async ({
  page,
}) => {
  await mockStudentApplicationApis(page, { mayCancel: true });
  await page.goto(`${appOrigin}/applications/app-1`);

  await expect(
    page.getByRole('button', { name: 'Cancel application' }),
  ).toBeVisible();
});

test('student cancel button is hidden when may_cancel is false', async ({
  page,
}) => {
  await mockStudentApplicationApis(page, { mayCancel: false });
  await page.goto(`${appOrigin}/applications/app-1`);

  await expect(
    page.getByRole('button', { name: 'Cancel application' }),
  ).toHaveCount(0);
});

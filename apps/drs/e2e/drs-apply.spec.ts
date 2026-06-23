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

type SubmittedApplyPayload = {
  email: string;
  contact_number: string;
  receive_mode: string;
  delivery_address: string | null;
  purpose: string | null;
  lines: Array<{
    requestable_type: 'document' | 'package';
    requestable_id: number;
    quantity: number;
  }>;
};

type MockStudentDrsApiOptions = {
  submitStatus?: number;
  submitMessage?: string;
};

async function mockStudentDrsApis(
  page: Page,
  options: MockStudentDrsApiOptions = {},
) {
  let submittedPayload: SubmittedApplyPayload | null = null;

  await page.route(authApi, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        id: 42,
        name: 'Simulated DRS Student',
        permissions: ['college-access'],
      },
    });
  });

  await page.route(`${registrarApi}/v1/drs/document-catalog`, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        data: [
          {
            id: 1,
            group_name: 'Academic Records',
            documents: [
              {
                id: 101,
                document_name: 'Official Transcript of Records',
                price: '150.00',
                is_active: true,
                allow_multiple_per_request: true,
                rules: [],
              },
              {
                id: 102,
                document_name: 'Certificate of Enrollment',
                price: '75.00',
                is_active: true,
                allow_multiple_per_request: false,
                rules: [],
              },
            ],
            packages: [
              {
                id: 201,
                package_name: 'Graduation Clearance Package',
                price: '350.00',
                is_active: true,
                allow_multiple_per_request: false,
                rules: [],
              },
            ],
          },
        ],
      },
    });
  });

  await page.route(`${registrarApi}/v1/drs/applications**`, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      headers: corsHeaders,
      json: {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
        },
      },
    });
  });

  await page.route(
    `${registrarApi}/v1/drs/apply/applications`,
    async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ headers: corsHeaders, status: 204 });
        return;
      }

      submittedPayload = route
        .request()
        .postDataJSON() as SubmittedApplyPayload;

      if (options.submitStatus && options.submitStatus >= 400) {
        await route.fulfill({
          contentType: 'application/json',
          headers: corsHeaders,
          status: options.submitStatus,
          json: {
            message: options.submitMessage ?? 'Could not submit request.',
          },
        });
        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders,
        status: 201,
        json: { data: { id: 'drs-application-001' } },
      });
    },
  );

  return {
    getSubmittedPayload: () => submittedPayload,
  };
}

test.describe('DRS student request simulation', () => {
  test('student searches the catalog and submits a document request', async ({
    page,
  }) => {
    const api = await mockStudentDrsApis(page);

    await page.goto('/');
    await expect(page.getByText('Your applications')).toBeVisible();

    await page.getByRole('link', { name: 'Apply for documents' }).click();
    await expect(
      page.getByRole('heading', { name: 'Build your request' }),
    ).toBeVisible();

    await page.getByLabel('Email').fill('student@example.edu.ph');
    await page.getByLabel('Contact number').fill('09171234567');
    await page.getByRole('combobox', { name: 'Receive documents by' }).click();
    await page.getByRole('option', { name: 'Courier delivery' }).click();
    await page
      .getByLabel('Delivery address')
      .fill('900 San Marcelino Street, Manila');
    await page.getByLabel('Purpose (optional)').fill('Employment application');

    await page.getByLabel('Filter catalog').fill('Transcript');
    await expect(
      page.getByText('Official Transcript of Records'),
    ).toBeVisible();
    await page
      .getByLabel('Include Official Transcript of Records in request')
      .check();
    await page
      .getByLabel('Increase quantity of Official Transcript of Records')
      .click();

    await expect(page.getByText('$300').first()).toBeVisible();
    await page.getByRole('button', { name: 'Review & submit' }).click();

    await expect(
      page.getByRole('heading', { name: 'Confirm your request' }),
    ).toBeVisible();
    await expect(page.getByText('Estimated total: $300')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm request' }).click();
    await expect(
      page.getByText('Request submitted successfully.'),
    ).toBeVisible();

    expect(api.getSubmittedPayload()).toEqual({
      email: 'student@example.edu.ph',
      contact_number: '09171234567',
      receive_mode: 'delivery',
      delivery_address: '900 San Marcelino Street, Manila',
      purpose: 'Employment application',
      lines: [
        {
          requestable_type: 'document',
          requestable_id: 101,
          quantity: 2,
        },
      ],
    });
  });

  test('student must choose at least one item before review', async ({
    page,
  }) => {
    await mockStudentDrsApis(page);

    await page.goto('/apply');
    await page.getByLabel('Email').fill('student@example.edu.ph');
    await page.getByLabel('Contact number').fill('09171234567');

    await expect(
      page.getByRole('button', { name: 'Review & submit' }),
    ).toBeDisabled();
  });

  test('student sees API validation failure and can retry submission', async ({
    page,
  }) => {
    await mockStudentDrsApis(page, {
      submitStatus: 422,
      submitMessage: 'Application period closed.',
    });

    await page.goto('/apply');
    await page.getByLabel('Email').fill('student@example.edu.ph');
    await page.getByLabel('Contact number').fill('09171234567');
    await page
      .getByLabel('Include Official Transcript of Records in request')
      .check();
    await page.getByRole('button', { name: 'Review & submit' }).click();

    await expect(
      page.getByRole('heading', { name: 'Confirm your request' }),
    ).toBeVisible();

    const confirmButton = page.getByRole('button', { name: 'Confirm request' });
    await confirmButton.click();

    await expect(page.getByText('Application period closed.')).toBeVisible();
    await expect(confirmButton).toBeEnabled();
  });
});

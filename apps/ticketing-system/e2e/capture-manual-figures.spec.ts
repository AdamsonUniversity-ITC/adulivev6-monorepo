import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  authBoardAdmin,
  authSuperAdmin,
  boardOrigin,
  fixtureBoard,
  fixtureTicket,
  mockTicketingSession,
  platformOrigin,
} from "./helpers.ts";

const figuresDir = path.resolve("docs/manual/figures");

async function saveFigure(page: Page, filename: string) {
  fs.mkdirSync(figuresDir, { recursive: true });
  await page.screenshot({
    path: path.join(figuresDir, filename),
    fullPage: true,
  });
}

async function settle(page: Page, heading: string) {
  await expect(
    page.getByRole("heading", { name: heading }).first(),
  ).toBeVisible();
  await page.waitForTimeout(400);
}

test.describe("manual figures", () => {
  test.describe.configure({ timeout: 90_000 });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("board screens", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("aduts-theme", "light");
    });
    await mockTicketingSession(page, {
      origin: boardOrigin,
      user: authBoardAdmin,
    });

    await page.goto("/");
    await settle(page, fixtureBoard.board_name);
    await expect(page.getByText(fixtureTicket.title)).toBeVisible();
    await saveFigure(page, "03-office-home.png");

    await page.goto("/tickets/new");
    await settle(page, "New Ticket");
    await saveFigure(page, "04-new-request.png");

    await page.goto(`/tickets/${fixtureTicket.ticket_number}`);
    await expect(page.getByText(fixtureTicket.title).first()).toBeVisible();
    await page.waitForTimeout(400);
    await saveFigure(page, "05-request-detail.png");

    await page.goto("/reports");
    await settle(page, "Reports");
    await saveFigure(page, "06-reports.png");

    await page.goto("/manage/");
    await settle(page, "Board Settings");
    await saveFigure(page, "07-office-settings.png");

    await page.goto("/manage/staff");
    await settle(page, "Staff");
    await saveFigure(page, "08-staff.png");

    await page.goto("/manage/customers");
    await settle(page, "Customers");
    await saveFigure(page, "09-customers.png");

    await page.goto("/manage/admins");
    await settle(page, "Board Admins");
    await saveFigure(page, "10-admins.png");

    await page.goto("/manage/categories");
    await settle(page, "Categories");
    await saveFigure(page, "11-categories.png");
  });

  test("platform screens", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("aduts-theme", "light");
    });
    await mockTicketingSession(page, {
      origin: platformOrigin,
      user: authSuperAdmin,
      boards: [fixtureBoard],
    });

    await page.goto(platformOrigin + "/");
    await settle(page, "Your Boards");
    await saveFigure(page, "02-your-offices.png");

    await page.goto(platformOrigin + "/admin/");
    await settle(page, "Board Tenants");
    await saveFigure(page, "12-offices-list.png");

    await page.goto(platformOrigin + "/admin/cancellation-reasons");
    await settle(page, "Cancellation Reasons");
    await saveFigure(page, "13-cancellation-reasons.png");
  });

  test("sign-in screen", async ({ page }) => {
    const response = await page
      .goto("http://login.localhost.test:8081/login", {
        timeout: 8_000,
        waitUntil: "domcontentloaded",
      })
      .catch(() => null);

    test.skip(
      response === null,
      "Login site is not reachable from this environment.",
    );
    await page.waitForTimeout(500);
    await saveFigure(page, "01-sign-in.png");
  });
});

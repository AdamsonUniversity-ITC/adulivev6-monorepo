import { expect, test } from "@playwright/test";

import {
  authBoardAdmin,
  authSuperAdmin,
  boardOrigin,
  fixtureBoard,
  fixtureTicket,
  mockTicketingSession,
  platformOrigin,
} from "./helpers.ts";

test.describe("ticketing page smokes (board host)", () => {
  test.beforeEach(async ({ page }) => {
    await mockTicketingSession(page, {
      origin: boardOrigin,
      user: authBoardAdmin,
    });
  });

  test("board home", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: fixtureBoard.board_name }),
    ).toBeVisible();
  });

  test("tickets list", async ({ page }) => {
    await page.goto("/tickets/");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });

  test("new ticket", async ({ page }) => {
    await page.goto("/tickets/new");
    await expect(
      page.getByRole("heading", { name: "New Ticket" }),
    ).toBeVisible();
  });

  test("ticket detail", async ({ page }) => {
    await page.goto(`/tickets/${fixtureTicket.ticket_number}`);
    await expect(page.getByText(fixtureTicket.title)).toBeVisible();
  });

  test("reports", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });

  test("manage board settings", async ({ page }) => {
    await page.goto("/manage/");
    await expect(
      page.getByRole("heading", { name: "Board Settings" }),
    ).toBeVisible();
  });

  test("manage admins", async ({ page }) => {
    await page.goto("/manage/admins");
    await expect(
      page.getByRole("heading", { name: "Board Admins" }),
    ).toBeVisible();
  });

  test("manage staff", async ({ page }) => {
    await page.goto("/manage/staff");
    await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  });

  test("manage customers", async ({ page }) => {
    await page.goto("/manage/customers");
    await expect(
      page.getByRole("heading", { name: "Customers" }),
    ).toBeVisible();
  });

  test("manage categories", async ({ page }) => {
    await page.goto("/manage/categories");
    await expect(
      page.getByRole("heading", { name: "Categories" }),
    ).toBeVisible();
  });

  test("manage templates", async ({ page }) => {
    await page.goto("/manage/templates");
    await expect(
      page.getByRole("heading", { name: "Templates" }),
    ).toBeVisible();
  });
});

test.describe("ticketing page smokes (platform host)", () => {
  test.beforeEach(async ({ page }) => {
    await mockTicketingSession(page, {
      origin: platformOrigin,
      user: authSuperAdmin,
      boards: [fixtureBoard],
    });
  });

  test("platform home", async ({ page }) => {
    await page.goto(platformOrigin + "/");
    await expect(
      page.getByRole("heading", { name: "Your Boards" }),
    ).toBeVisible();
  });

  test("admin boards", async ({ page }) => {
    await page.goto(platformOrigin + "/admin/");
    await expect(
      page.getByRole("heading", { name: "Board Tenants" }),
    ).toBeVisible();
  });

  test("new board", async ({ page }) => {
    await page.goto(platformOrigin + "/admin/boards/new");
    await expect(
      page.getByRole("heading", { name: "New Board" }),
    ).toBeVisible();
  });

  test("admin board detail", async ({ page }) => {
    await page.goto(platformOrigin + `/admin/boards/${fixtureBoard.id}`);
    await expect(
      page.getByRole("heading", { name: fixtureBoard.board_name }),
    ).toBeVisible();
  });
});

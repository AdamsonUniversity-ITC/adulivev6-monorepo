import { fireEvent, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "./mock-apis";
import {
  fetchAdminBoards,
  fetchBoardCustomers,
  fetchBoards,
  fetchTatReport,
  fetchTickets,
} from "@/lib/aduts-api";
import {
  PLATFORM_HOST,
  authBoardAdmin,
  authSuperAdmin,
  fixtureBoard,
  fixtureTicket,
} from "./fixtures";
import { renderApp } from "./render-app";

function forbiddenError() {
  return new AxiosError(
    "Request failed with status code 403",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    { status: 403, data: { message: "Forbidden." } } as AxiosResponse,
  );
}

describe("ticketing page smokes", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders platform home", async () => {
    await renderApp({
      initialPath: "/",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Your Boards" }),
      ).toBeInTheDocument();
    });
  });

  it("renders board home with tickets list", async () => {
    await renderApp({
      initialPath: "/",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: fixtureBoard.board_name }),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Open/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /In Progress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "New Ticket" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show quick tour" }),
    ).toBeInTheDocument();
  });

  it("redirects board tickets list to home", async () => {
    await renderApp({
      initialPath: "/tickets/",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: fixtureBoard.board_name }),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Open/i })).toBeInTheDocument();
    });
  });

  it("renders platform tickets list", async () => {
    await renderApp({
      initialPath: "/tickets/",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Tickets" }),
      ).toBeInTheDocument();
    });
  });

  it("renders new ticket", async () => {
    await renderApp({
      initialPath: "/tickets/new",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "New Ticket" }),
      ).toBeInTheDocument();
    });
  });

  it("renders ticket detail", async () => {
    await renderApp({
      initialPath: `/tickets/${fixtureTicket.ticket_number}`,
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(screen.getByText(fixtureTicket.title)).toBeInTheDocument();
    });
  });

  it("links back to the tickets list from ticket detail", async () => {
    await renderApp({
      initialPath: `/tickets/${fixtureTicket.ticket_number}`,
      authUser: authBoardAdmin,
    });

    const back = await screen.findByRole("link", { name: /back to tickets/i });
    // The list itself lives at /tickets on the platform host and at / on a
    // board host, which redirects with the search intact; either way the
    // target path starts at /tickets.
    expect(back.getAttribute("href")).toMatch(/^\/tickets/);
  });

  it("renders reports", async () => {
    await renderApp({
      initialPath: "/reports",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reports" }),
      ).toBeInTheDocument();
    });
  });

  it("shows the turnaround figures with readable durations and pending assignments", async () => {
    await renderApp({
      initialPath: "/reports",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Turnaround" })).toBeInTheDocument();
    });
    expect(screen.getByText("Time to Assignment")).toBeInTheDocument();
    expect(screen.getByText("0 awaiting assignment")).toBeInTheDocument();
    expect(
      screen.getByText(/Average wait from creation until a section head assigns/),
    ).toBeInTheDocument();
  });

  it("shows demand figures on the Demand tab", async () => {
    await renderApp({
      initialPath: "/reports",
      authUser: authBoardAdmin,
    });

    fireEvent.mouseDown(await screen.findByRole("tab", { name: "Demand" }));

    await waitFor(() => {
      expect(screen.getByText("Volume summary")).toBeInTheDocument();
    });
    expect(screen.getByText("Monthly average")).toBeInTheDocument();
    expect(screen.getByText("1.5")).toBeInTheDocument();
    expect(screen.getByText("Top requestors")).toBeInTheDocument();
    expect(screen.getByText("Ana Cruz")).toBeInTheDocument();
    expect(screen.getByText("User #6")).toBeInTheDocument();
  });

  it("shows service and quality figures on the Service and quality tab", async () => {
    await renderApp({
      initialPath: "/reports",
      authUser: authBoardAdmin,
    });

    fireEvent.mouseDown(
      await screen.findByRole("tab", { name: "Service and quality" }),
    );

    await waitFor(() => {
      expect(screen.getByText("SLA compliance")).toBeInTheDocument();
    });
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByText("Cancellation rate")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Reopen rate")).toBeInTheDocument();
    expect(screen.getByText("4.00 / 5")).toBeInTheDocument();
  });

  it("renders admin boards", async () => {
    await renderApp({
      initialPath: "/admin/",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Board Tenants" }),
      ).toBeInTheDocument();
    });
  });

  it("renders admin cancellation reasons", async () => {
    await renderApp({
      initialPath: "/admin/cancellation-reasons",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Cancellation Reasons" }),
      ).toBeInTheDocument();
    });
  });

  it("renders new board", async () => {
    await renderApp({
      initialPath: "/admin/boards/new",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "New Board" }),
      ).toBeInTheDocument();
    });
  });

  it("renders admin board detail", async () => {
    await renderApp({
      initialPath: `/admin/boards/${fixtureBoard.id}`,
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: fixtureBoard.board_name }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Visibility")).toHaveValue("production");
    });
  });

  it("uses employee search instead of raw user ids on admin board detail", async () => {
    await renderApp({
      initialPath: `/admin/boards/${fixtureBoard.id}`,
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
      boards: [{ ...fixtureBoard, visibility_mode: "maintenance" }],
    });

    await waitFor(() => {
      expect(screen.getByText("Maintenance access")).toBeInTheDocument();
    });

    // One picker for board admins and one for the maintenance allowlist.
    expect(
      screen.getAllByPlaceholderText("Name, ID, or email (min 2 characters)"),
    ).toHaveLength(2);
    expect(screen.queryByPlaceholderText("User ID")).not.toBeInTheDocument();
    // Employee-only: no person type select.
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add admin" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add user" })).toBeDisabled();
  });

  it("renders manage board settings", async () => {
    await renderApp({
      initialPath: "/manage/",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Board Settings" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Graphite/ }),
      ).toBeInTheDocument();
    });
  });

  it("renders manage admins", async () => {
    await renderApp({
      initialPath: "/manage/admins",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Board Admins" }),
      ).toBeInTheDocument();
    });
  });

  it("renders manage staff", async () => {
    await renderApp({
      initialPath: "/manage/staff",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Staff" }),
      ).toBeInTheDocument();
    });
  });

  it("renders manage customers", async () => {
    await renderApp({
      initialPath: "/manage/customers",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Customers" }),
      ).toBeInTheDocument();
    });
  });

  it("renders a search box on long customer lists", async () => {
    vi.mocked(fetchBoardCustomers).mockResolvedValueOnce(
      Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        user_id: 100 + i,
        name: `Customer ${i + 1}`,
      })),
    );

    await renderApp({
      initialPath: "/manage/customers",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("searchbox", { name: /search by name/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows access denied on the board ticket list when refused with 403", async () => {
    vi.mocked(fetchTickets).mockRejectedValueOnce(forbiddenError());

    await renderApp({
      initialPath: "/",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Access denied" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /In Progress/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Failed to load tickets.")).not.toBeInTheDocument();
  });

  it("shows access denied on platform home when boards are refused with 403", async () => {
    vi.mocked(fetchBoards).mockRejectedValueOnce(forbiddenError());

    await renderApp({
      initialPath: "/",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Access denied" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Could not load boards. Sign in and retry."),
    ).not.toBeInTheDocument();
  });

  it("shows access denied on reports when the report is refused with 403", async () => {
    vi.mocked(fetchTatReport).mockRejectedValueOnce(forbiddenError());

    await renderApp({
      initialPath: "/reports",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Access denied" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "Reports" }),
    ).not.toBeInTheDocument();
  });

  it("shows access denied on admin boards when refused with 403", async () => {
    vi.mocked(fetchAdminBoards).mockRejectedValueOnce(forbiddenError());

    await renderApp({
      initialPath: "/admin/",
      hostname: PLATFORM_HOST,
      authUser: authSuperAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Access denied" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Could not load boards."),
    ).not.toBeInTheDocument();
  });

  it("renders manage categories", async () => {
    await renderApp({
      initialPath: "/manage/categories",
      authUser: authBoardAdmin,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Categories" }),
      ).toBeInTheDocument();
    });
  });
});

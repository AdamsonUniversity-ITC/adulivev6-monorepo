import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "./mock-apis";
import {
  PLATFORM_HOST,
  authBoardAdmin,
  authSuperAdmin,
  fixtureBoard,
  fixtureTicket,
} from "./fixtures";
import { renderApp } from "./render-app";

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
    });
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

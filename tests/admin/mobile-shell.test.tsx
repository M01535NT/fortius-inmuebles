import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AdminShell } from "@/components/admin/admin-shell";
import { clearAdminCache } from "@/lib/admin/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

beforeEach(() => {
  clearAdminCache();
  vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(
    url === "/api/auth/session"
      ? { user: { id: "mobile-staff", email: "mobile@example.invalid", role: "admin" } }
      : { records: [] },
  )));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openMenu() {
  render(<AdminShell><h1>Contenido del panel</h1><button>Acción del contenido</button></AdminShell>);
  await screen.findByRole("heading", { name: "Contenido del panel" });
  const trigger = screen.getByRole("button", { name: "Menú del panel" });
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, nav: screen.getByRole("navigation", { name: "Módulos móviles" }) };
}

test("mobile menu exposes the signed-in account and Escape restores trigger focus", async () => {
  const { trigger, nav } = await openMenu();
  expect(within(nav).getByText("mobile@example.invalid")).toBeTruthy();
  expect(nav.contains(document.activeElement)).toBe(true);
  fireEvent.click(within(nav).getByRole("button", { name: "Más herramientas" }));
  within(nav).getByRole("link", { name: "Clientes" }).focus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("navigation", { name: "Módulos móviles" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

test("mobile menu closes on outside pointer without stealing focus", async () => {
  await openMenu();
  const target = screen.getByRole("button", { name: "Acción del contenido" });
  target.focus();
  fireEvent.pointerDown(target);
  expect(screen.queryByRole("navigation", { name: "Módulos móviles" })).toBeNull();
  expect(document.activeElement).toBe(target);
});

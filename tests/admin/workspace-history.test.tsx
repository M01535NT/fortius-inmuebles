import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import HistoryPage from "@/app/admin/historial/page";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({
  useSession: () => ({ id: "admin", role: "admin" }),
  apiRequest: request,
  errorMessage: (e: Error) => e.message,
  loadAdminData: vi.fn(),
}));
afterEach(() => {
  cleanup();
  request.mockReset();
});
test("clicking the current history tab does not leave a permanent spinner", async () => {
  request.mockResolvedValue({ entries: [], hasMore: false });
  render(<HistoryPage />);
  await waitFor(() =>
    expect(screen.queryByText("Cargando historial…")).toBeNull(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Actividad" }),
  );
  expect(screen.queryByText("Cargando historial…")).toBeNull();
});
test("successful history retry clears the obsolete error", async () => {
  request
    .mockRejectedValueOnce(new Error("No disponible"))
    .mockResolvedValue({ entries: [], hasMore: false });
  render(<HistoryPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

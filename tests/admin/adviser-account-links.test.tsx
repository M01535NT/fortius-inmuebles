import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdviserAccountLinks } from "@/components/admin/adviser-account-links";

it("oculta la vinculación de cuentas a quien no es administrador", () => {
  vi.stubGlobal("fetch", vi.fn());
  render(<AdviserAccountLinks isAdmin={false} advisers={[]} />);
  expect(screen.queryByText("Cuentas de asesores")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { AsyncForm } from "@/components/admin/ui";

afterEach(cleanup);
test("failed form submission brings its error into focus and retains the draft", async () => {
  render(<AsyncForm onSubmit={async () => { throw new Error("No se pudo guardar"); }}>
    <label htmlFor="draft-title">Título</label>
    <input id="draft-title" defaultValue="Borrador conservado" />
    <button type="submit">Guardar</button>
  </AsyncForm>);
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  const error = await screen.findByRole("alert");
  await waitFor(() => expect(document.activeElement?.contains(error)).toBe(true));
  expect(document.activeElement).not.toBe(document.body);
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Borrador conservado");
});

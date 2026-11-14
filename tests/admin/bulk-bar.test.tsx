import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkBar, InlineSelect, SelectBox, SelectToggle, useSelection, type BulkAction } from "@/components/admin/workspace/bulk";
import { AdminApiError } from "@/lib/admin/store";

/* RP-12/RP-13 (UX-03, boceto aprobado 13/11/2026): selección, resultado por registro, reintento y edición en la fila. */
afterEach(cleanup);
const targets = [{ id: "a", label: "Pedir el predial" }, { id: "b", label: "Confirmar visita" }, { id: "c", label: "Revisar escritura" }];

function Harness({ apply, run }: { apply: BulkAction["apply"]; run?: (ids: string[]) => void }) {
  const selection = useSelection(targets.map(t => t.id));
  const actions: BulkAction[] = [{ id: "responsable", label: "Reasignar a…", verb: "Se reasignaron", options: [{ value: "ana", label: "Ana" }], apply }, { id: "exportar", label: "Exportar", run }];
  return <>
    <SelectToggle selection={selection} noun="tareas" />
    {selection.on && targets.map(t => <SelectBox key={t.id} selection={selection} id={t.id} label={t.label} />)}
    <BulkBar selection={selection} targets={targets} actions={actions} noun={{ one: "tarea seleccionada", many: "tareas seleccionadas", empty: "Elige tareas en la lista" }} />
  </>;
}

test("aplica a cada tarea, informa la que falló y al reintentar solo repite esa", async () => {
  const calls: string[] = [];
  let conflict = true;
  render(<Harness apply={async id => { calls.push(id); if (id === "b" && conflict) { conflict = false; throw new AdminApiError(409, "cambió"); } return "aplicado"; }} />);
  fireEvent.click(screen.getByRole("button", { name: /Seleccionar/ }));
  expect(screen.getByText("Elige tareas en la lista")).toBeTruthy();
  for (const t of targets) fireEvent.click(screen.getByRole("checkbox", { name: `Seleccionar: ${t.label}` }));
  expect(screen.getByText("3 tareas seleccionadas")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Elige qué cambiar antes de aplicar.");
  fireEvent.change(screen.getByRole("combobox", { name: "Reasignar a…" }), { target: { value: "ana" } });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
  expect(await screen.findByText("Se reasignaron 2 de 3. Una no se aplicó.")).toBeTruthy();
  expect(screen.getByText(/Alguien la cambió mientras tanto/)).toBeTruthy();
  // Lo que falló queda seleccionado; lo aplicado sale de la selección.
  expect(screen.getByText("1 tarea seleccionada")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar la que falló" }));
  expect(await screen.findByText("Se reasignaron 3 de 3.")).toBeTruthy();
  expect(screen.getByText("Las que ya se habían aplicado no se repitieron.")).toBeTruthy();
  expect(calls).toEqual(["a", "b", "c", "b"]);
});

test("exportar recibe lo seleccionado sin pasar por «Aplicar»", () => {
  const run = vi.fn();
  render(<Harness apply={async () => "aplicado"} run={run} />);
  fireEvent.click(screen.getByRole("button", { name: /Seleccionar/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Seleccionar: Revisar escritura" }));
  fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
  expect(run).toHaveBeenCalledWith(["c"]);
});

test("el responsable se cambia en la fila y un error se muestra junto al dato", async () => {
  const onSave = vi.fn().mockRejectedValueOnce(new Error("No se pudo guardar.")).mockResolvedValue(undefined);
  render(<InlineSelect label="Responsable de «Pedir el predial»" value="" options={[{ value: "", label: "Sin asignar" }, { value: "ana", label: "Ana" }]} display="Sin asignar" onSave={onSave} />);
  fireEvent.click(screen.getByRole("button", { name: /Responsable de «Pedir el predial»/ }));
  fireEvent.change(screen.getByRole("combobox", { name: "Responsable de «Pedir el predial»" }), { target: { value: "ana" } });
  expect((await screen.findByRole("alert")).textContent).toBe("No se pudo guardar.");
  fireEvent.click(screen.getByRole("button", { name: /Responsable de «Pedir el predial»/ }));
  fireEvent.change(screen.getByRole("combobox", { name: "Responsable de «Pedir el predial»" }), { target: { value: "ana" } });
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave).toHaveBeenLastCalledWith("ana");
});

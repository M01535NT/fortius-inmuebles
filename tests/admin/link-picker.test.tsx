// @vitest-environment jsdom
import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LinkPicker, type LinkValue } from "@/components/admin/workspace/link-picker";

/* SIM-17 (C51): el selector «¿Con quién o sobre qué?» común a cita, tarea y herramienta. */
afterEach(cleanup);
const clientes = [{ id: "c1", nombre: "Cliente de ejemplo", telefono: "6640000000" }];
const propiedades = [{ slug: "p1", codigo: "F-01", titulo: "Casa de ejemplo" }];
const operations = [{ id: "e1", folio: "VTA-01", cliente_id: "c1", propiedad_slug: "p1", asesor_id: "a1" }];

function Harness({ kinds }: { kinds?: ("lead" | "cliente" | "propiedad" | "expediente")[] }) {
  const [value, setValue] = React.useState<LinkValue>({});
  return <><LinkPicker id="v" value={value} onChange={setValue} clientes={clientes} propiedades={propiedades} operations={operations} kinds={kinds} /><output>{JSON.stringify(value)}</output></>;
}

test("con el teclado elige una operación y trae su cliente e inmueble; quitar el inmueble la desvincula", () => {
  render(<Harness />);
  const input = screen.getByRole("combobox", { name: "¿Con quién o sobre qué?" });
  fireEvent.change(input, { target: { value: "vta" } });
  expect(screen.getAllByRole("option")).toHaveLength(1);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(JSON.parse(screen.getByRole("status", { hidden: true })?.textContent ?? "{}")).toEqual({ expedienteId: "e1", clienteId: "c1", propiedadSlug: "p1" });
  fireEvent.click(screen.getByRole("button", { name: "Quitar inmueble F-01 · Casa de ejemplo" }));
  expect(JSON.parse(screen.getByRole("status", { hidden: true })?.textContent ?? "{}")).toEqual({ clienteId: "c1" });
});

test("busca por teléfono sin acentos y respeta qué se puede buscar", () => {
  const { unmount } = render(<Harness />);
  fireEvent.change(screen.getByLabelText("¿Con quién o sobre qué?"), { target: { value: "664" } });
  expect(screen.getByRole("option", { name: /Cliente de ejemplo/ })).toBeTruthy();
  unmount();
  render(<Harness kinds={["expediente"]} />);
  fireEvent.change(screen.getByLabelText("¿Con quién o sobre qué?"), { target: { value: "ejemplo" } });
  expect(screen.getAllByRole("option").map(o => o.textContent)).toEqual(["VTA-01Operación · Cliente de ejemplo · F-01"]);
});

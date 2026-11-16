import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AvisosProvider, useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Hoja } from "@/components/panel/kit/hoja";
import { ListaReordenable } from "@/components/panel/kit/reordenable";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { SelectorFecha, SelectorHora } from "@/components/panel/kit/selector-fecha";

afterEach(() => { cleanup(); vi.useRealTimers(); });

test("PN-01 botón: deshabilitado no ejecuta la acción y avisa por aria-disabled", () => {
  const f = vi.fn();
  render(<Boton deshabilitado onClick={f}>Agendar visita</Boton>);
  const b = screen.getByRole("button", { name: "Agendar visita" });
  expect(b.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(b);
  expect(f).not.toHaveBeenCalled();
});

test("PN-01 campo: la etiqueta está enlazada y el error se anuncia, con mensaje y sin depender del color", () => {
  render(<Campo etiqueta="Correo electrónico" error="Falta el dominio. Ejemplo: nombre@correo.com" defaultValue="nombre@correo" />);
  const campo = screen.getByLabelText("Correo electrónico");
  expect(campo.getAttribute("aria-invalid")).toBe("true");
  const msg = screen.getByRole("alert");
  expect(msg.textContent).toContain("Falta el dominio");
  expect(campo.getAttribute("aria-describedby")).toContain(msg.id);
});

test("PN-01 campo: los montos se escriben con comas de millar", () => {
  expect(formatoMonto("3000000")).toBe("3,000,000");
  expect(formatoMonto("$1,234.5")).toBe("1,234.5");
  expect(formatoMonto("abc")).toBe("");
  expect(montoANumero("$3,000,000")).toBe(3000000);
  expect(montoANumero("")).toBe(0);
});

test("PN-01 segmentado: con dos opciones es interruptor y avisa el cambio", () => {
  const f = vi.fn();
  render(<Segmentado etiqueta="Ver" valor="a" alElegir={f} opciones={[{ valor: "a", etiqueta: "Te deben", cuenta: 5 }, { valor: "b", etiqueta: "Por entregar" }]} />);
  const s = screen.getByRole("switch", { name: /Ver: Te deben/ });
  expect(s.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(s);
  expect(f).toHaveBeenCalledWith("b");
});

test("PN-01 hoja: Esc la cierra, el título la nombra y devuelve el foco a quien la abrió", () => {
  const cerrar = vi.fn();
  function Prueba() {
    const [abierta, setAbierta] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setAbierta(true)}>Abrir</button>
        <Hoja abierta={abierta} titulo="Movimiento nuevo" alCerrar={() => { cerrar(); setAbierta(false); }}>
          <Campo etiqueta="Asunto" />
        </Hoja>
      </>
    );
  }
  render(<Prueba />);
  const abrir = screen.getByRole("button", { name: "Abrir" });
  abrir.focus();
  fireEvent.click(abrir);
  expect(screen.getByRole("dialog", { name: "Movimiento nuevo" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText("Asunto"));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(cerrar).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(abrir);
});

test("PN-01 avisos: el aviso con Deshacer ejecuta la acción y desaparece; sin tocarlo se va solo", async () => {
  const deshacer = vi.fn();
  function Prueba() {
    const { avisar } = useAvisos();
    return (
      <>
        <button type="button" onClick={() => avisar("Cobro registrado", { etiqueta: "Deshacer", alAccionar: deshacer })}>Cobrar</button>
        <button type="button" onClick={() => avisar("Nombre guardado", { duracion: 200 })}>Guardar</button>
      </>
    );
  }
  render(<AvisosProvider><Prueba /></AvisosProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
  expect(await screen.findByText("Cobro registrado")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
  expect(deshacer).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByText("Cobro registrado")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByText("Nombre guardado")).toBeTruthy();
  await waitFor(() => expect(screen.queryByText("Nombre guardado")).toBeNull(), { timeout: 2000 });
});

test("PN-01 selector de fecha: los días pasados no se eligen, se elige uno futuro y el mes no retrocede antes de hoy", () => {
  const f = vi.fn();
  render(<SelectorFecha valor={null} alElegir={f} hoy={new Date(2026, 10, 15)} />);
  expect((screen.getByRole("button", { name: "sábado 14 nov" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "viernes 20 nov" }));
  expect(f).toHaveBeenCalledWith("2026-11-20");
  fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
  expect(screen.getByText("diciembre 2026")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Mes anterior" }).getAttribute("aria-disabled")).toBeNull();
});

test("PN-01 selector de hora: avanza y retrocede de 30 en 30 minutos", () => {
  const f = vi.fn();
  render(<SelectorHora valor={600} alCambiar={f} />);
  expect(screen.getByText("10:00")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "30 minutos después" }));
  expect(f).toHaveBeenCalledWith(630);
  fireEvent.click(screen.getByRole("button", { name: "30 minutos antes" }));
  expect(f).toHaveBeenCalledWith(570);
});

type Paso = { id: string; n: string };
const PASOS: Paso[] = [{ id: "1", n: "Primero" }, { id: "2", n: "Segundo" }, { id: "3", n: "Tercero" }];

function Reordenable({ alReordenar }: { alReordenar: (n: Paso[], m: Paso, l: number) => void }) {
  return (
    <ListaReordenable items={PASOS} clave={(p) => p.id} nombre={(p) => p.n} etiqueta="Pasos" bloqueado={(p) => p.id === "1"} alReordenar={alReordenar}
      renderItem={(p, { asa }) => <div>{p.n}{asa}</div>} />
  );
}

test("PN-01 arrastrar: con el teclado se sube y se baja un paso, y avisa para el lector de pantalla", () => {
  const f = vi.fn();
  render(<Reordenable alReordenar={f} />);
  fireEvent.keyDown(screen.getByRole("button", { name: "Mover Tercero" }), { key: "ArrowUp" });
  expect(f).toHaveBeenCalledOnce();
  expect(f.mock.calls[0][0].map((p: Paso) => p.n)).toEqual(["Primero", "Tercero", "Segundo"]);
  expect(f.mock.calls[0][2]).toBe(2);
  expect(screen.getByText("Tercero quedó en el lugar 2 de 3")).toBeTruthy();
});

test("PN-01 arrastrar: un paso obligatorio no tiene asa ni se puede ocupar su lugar", () => {
  const f = vi.fn();
  render(<Reordenable alReordenar={f} />);
  expect(screen.queryByRole("button", { name: "Mover Primero" })).toBeNull();
  fireEvent.keyDown(screen.getByRole("button", { name: "Mover Segundo" }), { key: "ArrowUp" });
  expect(f).not.toHaveBeenCalled();
  expect(screen.getByText("Segundo no se puede mover a ese lugar")).toBeTruthy();
});

test("PN-01 arrastrar: con el ratón, soltar sobre otro lugar reordena y soltar fuera no cambia nada", () => {
  const f = vi.fn();
  const { container } = render(<Reordenable alReordenar={f} />);
  const filas = container.querySelectorAll("li");
  const datos = { effectAllowed: "", dropEffect: "", setData: vi.fn() };
  fireEvent.dragStart(filas[2], { dataTransfer: datos });
  fireEvent.dragOver(filas[1], { dataTransfer: datos });
  fireEvent.drop(filas[1], { dataTransfer: datos });
  expect(f).toHaveBeenCalledOnce();
  expect(f.mock.calls[0][0].map((p: Paso) => p.n)).toEqual(["Primero", "Tercero", "Segundo"]);
  f.mockClear();
  fireEvent.dragStart(filas[2], { dataTransfer: datos });
  fireEvent.dragEnd(filas[2], { dataTransfer: datos });
  expect(f).not.toHaveBeenCalled();
});

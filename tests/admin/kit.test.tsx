import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Button, ProgressBar, Segmented, Sheet, StageProgress, StatusChip, Tabs } from "@/components/admin/kit";

afterEach(cleanup);
const STAGES = ["Captación", "Verificación y precio", "Contrato y preparación", "Publicación y seguimiento", "Visitas y ofertas", "Cierre y entrega"];

test("los estados de requisito usan el lenguaje sencillo del glosario", () => {
  render(<>{(["pendiente", "recibido", "revisado", "observado", "no_aplica"] as const).map(k => <StatusChip key={k} state={k} />)}</>);
  for (const label of ["Pendiente", "Lo tengo", "Revisado ✓", "Hay un problema", "No aplica"]) expect(screen.getByText(label)).toBeTruthy();
});

test("el avance marca la etapa actual y numera del 1 al 6", () => {
  render(<StageProgress stages={STAGES} current={2} />);
  const current = screen.getByRole("listitem", { current: "step" });
  expect(current.textContent).toContain("2Verificación y precio");
  expect(current.textContent).toContain("Aquí vas");
  expect(screen.getAllByRole("listitem")[0].textContent).toContain("Lista");
});

test("una etapa pasada con algo pendiente lo dice y se puede abrir", () => {
  const onSelect = vi.fn();
  render(<StageProgress stages={STAGES} current={3} warnings={{ 1: "Falta el 02" }} selectable={[1]} onSelect={onSelect} />);
  const [first, second] = screen.getAllByRole("listitem");
  expect(first.textContent).toContain("Falta el 02");
  expect(within(second).queryByRole("button")).toBeNull();
  fireEvent.click(within(first).getByRole("button", { name: /Captación/ }));
  expect(onSelect).toHaveBeenCalledWith(1);
});

test("en celular el avance se lee como «Etapa N de 6» con barra accesible", () => {
  render(<StageProgress stages={STAGES} current={3} compact />);
  expect(screen.getByText("Etapa 3 de 6")).toBeTruthy();
  expect(screen.getByRole("progressbar", { name: "Etapa 3 de 6" }).getAttribute("aria-valuenow")).toBe("3");
});

test("la barra de progreso no se sale de sus límites", () => {
  render(<ProgressBar value={9} max={6} label="Avance" />);
  expect((screen.getByRole("progressbar").firstChild as HTMLElement).style.width).toBe("100%");
});

test("las pestañas cambian con clic y con flechas, y solo la activa recibe foco con Tab", () => {
  const Demo = () => { const [v, setV] = React.useState<"a" | "b" | "c">("a"); return <Tabs idPrefix="t" label="Secciones" value={v} onChange={setV} items={[{ id: "a", label: "Lo que sigue" }, { id: "b", label: "Documentos", count: 6 }, { id: "c", label: "Ajustes" }]} />; };
  render(<Demo />);
  const [a, b, c] = screen.getAllByRole("tab");
  expect(a.getAttribute("aria-selected")).toBe("true"); expect(b.tabIndex).toBe(-1);
  fireEvent.click(b); expect(b.getAttribute("aria-selected")).toBe("true");
  fireEvent.keyDown(b, { key: "ArrowRight" }); expect(c.getAttribute("aria-selected")).toBe("true");
  fireEvent.keyDown(c, { key: "ArrowRight" }); expect(a.getAttribute("aria-selected")).toBe("true");
  expect(b.textContent).toBe("Documentos6");
});

test("el selector segmentado se comporta como grupo de opciones", () => {
  const change = vi.fn();
  render(<Segmented label="Mostrar" value="mias" onChange={change} options={[{ id: "mias", label: "Mías" }, { id: "equipo", label: "Todo el equipo" }]} />);
  expect(screen.getByRole("radio", { name: "Mías" }).getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("radio", { name: "Todo el equipo" }));
  expect(change).toHaveBeenCalledWith("equipo");
});

test("el panel lateral enfoca su primer campo, cierra con Escape y con el velo", () => {
  const close = vi.fn();
  const { rerender } = render(<Sheet open onClose={close} eyebrow="Marcar como revisado" title="Que se pueda vender sin obstáculos" footer={<Button variant="primary">Guardar como revisado</Button>}><label htmlFor="q">Qué encontraste</label><textarea id="q" /></Sheet>);
  expect(screen.getByRole("dialog", { name: "Que se pueda vender sin obstáculos" })).toBeTruthy();
  expect(document.activeElement?.id).toBe("q");
  fireEvent.keyDown(document, { key: "Escape" }); expect(close).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getAllByRole("button", { name: "Cerrar" })[0]); expect(close).toHaveBeenCalledTimes(2);
  rerender(<Sheet open={false} onClose={close} title="X"><p>Nada</p></Sheet>);
  expect(screen.queryByRole("dialog")).toBeNull();
});

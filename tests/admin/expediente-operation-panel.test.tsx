import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const base = {
  id: "52000000-0000-4000-8000-000000000010", version: 1, asesor_id: "own",
  etapa: "captacion" as const, fecha_objetivo: null, checklist: {}, created_at: "2026-10-01T12:00:00Z",
  updated_at: "2026-10-01T12:00:00Z",
};
it("guarda etapa, fecha y checklist con versión y muestra la actividad", async () => {
  const saved = vi.fn();
  const dirty = vi.fn();
  const writes: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      writes.push(body);
      return Response.json({ expediente: {
        ...base, version: 2, etapa: body.etapa, fecha_objetivo: body.fechaObjetivo,
        checklist: body.checklist,
      } });
    }
    if (url.endsWith("/actividad")) return Response.json({ actividad: [{
      id: "a1", tipo: "cambio", descripcion: "Etapa: captacion → documentacion",
      created_by: "own", created_at: "2026-10-04T12:00:00Z",
    }] });
    throw new Error("Ruta inesperada");
  });
  render(<ExpedienteOperationPanel expediente={base} responsable="Ana" onSaved={saved} onDirtyChange={dirty} />);
  expect(screen.getByText(/Responsable:/).closest("p")?.textContent).toContain("Ana");
  fireEvent.change(screen.getByLabelText("Etapa"), { target: { value: "documentacion" } });
  fireEvent.change(screen.getByLabelText("Fecha objetivo"), { target: { value: "2026-11-15" } });
  fireEvent.change(screen.getByLabelText("Identificación del titular"), { target: { value: "recibido" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar seguimiento" }));
  await waitFor(() => expect(writes).toEqual([{
    version: 1, etapa: "documentacion", fechaObjetivo: "2026-11-15", checklist: { identidad: "recibido" },
  }]));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ version: 2, etapa: "documentacion" })));
  expect(await screen.findByText("Etapa: captacion → documentacion")).toBeTruthy();
  expect(dirty).toHaveBeenCalledWith(true);
});

it("protege una nota pendiente y conserva su contenido si falla el registro", async () => {
  const dirty=vi.fn();
  vi.stubGlobal("fetch",async(_url:string,init?:RequestInit)=>init?.method==="POST"?Response.json({error:"Registro rechazado"},{status:503}):Response.json({actividad:[]}));
  render(<ExpedienteOperationPanel expediente={base} responsable="Ana" onSaved={vi.fn()} onDirtyChange={dirty}/>);
  fireEvent.change(screen.getByLabelText("Nueva nota"),{target:{value:"Revisar soporte original"}});
  expect(dirty).toHaveBeenLastCalledWith(true);
  expect((screen.getByRole("button",{name:"Guardar seguimiento"}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button",{name:"Registrar nota"}));
  await screen.findByText(/Registro rechazado/);
  expect((screen.getByLabelText("Nueva nota") as HTMLTextAreaElement).value).toBe("Revisar soporte original");
  expect(dirty).toHaveBeenLastCalledWith(true);
});

it("el atajo de revisión no sustituye una nota que ya se está escribiendo",()=>{
  vi.stubGlobal("fetch",async()=>Response.json({actividad:[]}));
  render(<ExpedienteOperationPanel expediente={{...base,checklist:{identidad:"recibido"}}} responsable="Ana" onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText("Nueva nota"),{target:{value:"Texto pendiente de revisión"}});
  const shortcut=screen.getByRole("button",{name:"Revisar Identificación del titular"}) as HTMLButtonElement;
  expect(shortcut.disabled).toBe(true);
  fireEvent.click(shortcut);
  expect((screen.getByLabelText("Nueva nota") as HTMLTextAreaElement).value).toBe("Texto pendiente de revisión");
});

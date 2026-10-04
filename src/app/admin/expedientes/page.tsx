"use client";
import * as React from "react";
import { PageHeader, btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { db, useCollection } from "@/lib/admin/store";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calcularPresupuesto } from "@/lib/formatos/presupuesto";
import { CARGOS_NETO, calcularNeto } from "@/lib/formatos/neto";

type Expediente = { id: string; cliente_id: string; asesor_id: string; propiedad_slug: string | null; folio: string; operacion: string; unidad: string; version: number };
type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };
type Emision = { id: string; draft_version: number; created_at: string; sha256: string };
type Copia = { id: string; emission_id: string; created_at: string; sha256: string };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "No se pudo completar la operación");
  return body as T;
}

export default function ExpedientesPage() {
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const [expedientes, setExpedientes] = React.useState<Expediente[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [documentos, setDocumentos] = React.useState<Documento[]>([]);
  const [documento, setDocumento] = React.useState<Documento | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [emisiones, setEmisiones] = React.useState<Emision[]>([]);
  const [copias, setCopias] = React.useState<Record<string, Copia[]>>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    json<{ expedientes: Expediente[] }>("/api/admin/expedientes")
      .then((result) => { if (active) setExpedientes(result.expedientes); })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    if (!selectedId) return;
    let active = true;
    json<{ documentos: Documento[] }>(`/api/admin/expedientes/${selectedId}/formatos`)
      .then((result) => { if (active) setDocumentos(result.documentos); })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [selectedId]);

  async function createExpediente(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const data = new FormData(event.currentTarget);
      const clienteId = String(data.get("clienteId") ?? "");
      const cliente = clientes.find((item) => item.id === clienteId);
      if (!cliente?.asesorId) throw new Error("Asigna un asesor responsable al cliente antes de abrir su expediente.");
      const result = await json<{ expediente: Expediente }>("/api/admin/expedientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, asesorId: cliente.asesorId, folio: String(data.get("folio") ?? "").trim(), operacion: String(data.get("operacion") ?? "venta"), propiedadSlug: String(data.get("propiedadSlug") ?? "") || undefined, unidad: String(data.get("unidad") ?? "") }),
      });
      setExpedientes((items) => [result.expediente, ...items]); setSelectedId(result.expediente.id); setDocumento(null);
      event.currentTarget.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function createDocumento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const formatoId = String(new FormData(event.currentTarget).get("formatoId"));
      const initialData = formatoId === "08" ? { erogaciones: CARGOS_NETO.map((item) => ({ concepto: item.key, estado: "Pendiente", justificacion: "" })) } : {};
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${selectedId}/formatos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formatoId, data: initialData }),
      });
      setDocumentos((items) => [result.documento, ...items]); setDocumento(result.documento); setValues(result.documento.data); setEmisiones([]); setCopias({});
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function openDocumento(id: string) {
    setError("");
    try {
      const result = await json<{ documento: Documento; emisiones: Emision[] }>(`/api/admin/formatos/${id}`);
      setDocumento(result.documento); setValues(result.documento.data); setEmisiones(result.emisiones);
      const pairs = await Promise.all(result.emisiones.map(async (item) => {
        const response = await json<{ copias: Copia[] }>(`/api/admin/emisiones/${item.id}/firmado`);
        return [item.id, response.copias] as const;
      }));
      setCopias(Object.fromEntries(pairs));
    } catch (cause) { setError(String(cause)); }
  }
  async function saveDocumento() {
    if (!documento) return;
    setError(""); setBusy(true);
    try {
      const result = await json<{ documento: Documento }>(`/api/admin/formatos/${documento.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: documento.version, data: values }),
      });
      setDocumento(result.documento);
      setDocumentos((items) => items.map((item) => item.id === result.documento.id ? result.documento : item));
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function emitDocumento() {
    if (!documento) return;
    setError(""); setBusy(true);
    try {
      const result = await json<{ emision: Emision }>(`/api/admin/formatos/${documento.id}/emitir`, { method: "POST" });
      setEmisiones((items) => [result.emision, ...items]);
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function uploadSignedCopy(emissionId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const result = await json<{ copia: Copia }>(`/api/admin/emisiones/${emissionId}/firmado`, { method: "POST", body: form });
      setCopias((current) => ({ ...current, [emissionId]: [result.copia, ...(current[emissionId] ?? [])] }));
      event.currentTarget.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  const selected = expedientes.find((item) => item.id === selectedId);
  const definition = documento ? formatoById(documento.formato_id) : null;
  const missing = definition ? validateFormato(definition.id, { ...values, folio: selected?.folio }) : [];
  const budgetTotals = definition?.id === "19" && missing.length === 0 ? calcularPresupuesto(values) : null;
  const netTotals = definition?.id === "08" && missing.length === 0 ? calcularNeto({ ...values, folio: selected?.folio }) : null;
  const hasUnsavedChanges = documento ? JSON.stringify(values) !== JSON.stringify(documento.data) : false;
  return <div className="space-y-8">
    <PageHeader title="Expedientes y formatos" description="Catálogo de 25 formatos exclusivos. Cada PDF requiere captura completa y cotejo con el original." />
    <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Los formatos 02 (entrevista inicial), 08 (neto del propietario), 10 (plan), 11 (reporte comercial), 12 (comprador), 13 (visita), 14 (propuesta y respuesta), 16 (entrega), 17 (cierre), 18 (recibo) y 19 (presupuesto) admiten emisión. Los campos de los otros 14 formatos son preliminares y no reproducen aún sus Word o Excel originales; sus PDFs permanecen bloqueados.</p>
    {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="display-soft mb-4 text-xl">Nuevo expediente</h2>
      <form onSubmit={createExpediente} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Cliente<select name="clienteId" required className={selectClass}><option value="">Selecciona</option>{clientes.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.asesorId ? "" : " · sin asesor"}</option>)}</select></label>
        <label className="text-sm">Folio<input name="folio" required maxLength={80} className={inputClass} /></label>
        <label className="text-sm">Operación<select name="operacion" className={selectClass}><option value="venta">Venta</option><option value="renta">Renta</option><option value="administracion">Administración</option><option value="otra">Otra</option></select></label>
        <label className="text-sm">Inmueble<select name="propiedadSlug" className={selectClass}><option value="">Sin vincular</option>{propiedades.map((item) => <option key={item.slug} value={item.slug}>{item.titulo}</option>)}</select></label>
        <label className="text-sm">Unidad, si aplica<input name="unidad" className={inputClass} /></label>
        <button type="submit" disabled={busy} className={btnPrimary + " self-end"}>Crear expediente</button>
      </form>
    </section>
    <section className="grid gap-6 lg:grid-cols-[minmax(240px,340px)_1fr]">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="display-soft mb-4 text-xl">Expedientes</h2>
        {expedientes.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay expedientes visibles para tu cuenta.</p>}
        <div className="space-y-2">{expedientes.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setDocumento(null); setEmisiones([]); }} className={`w-full rounded-md border p-3 text-left text-sm ${item.id === selectedId ? "border-primary" : "border-border"}`}><strong className="block">{item.folio}</strong><span>{clientes.find((client) => client.id === item.cliente_id)?.nombre ?? item.cliente_id}</span></button>)}</div>
      </div>
      <div className="space-y-6">{selected && <>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft mb-3 text-xl">{selected.folio}</h2>
          <form onSubmit={createDocumento} className="flex flex-wrap items-end gap-3">
            <label className="min-w-[240px] flex-1 text-sm">Formato<select name="formatoId" required className={selectClass}>{FORMATOS.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label>
            <button type="submit" disabled={busy} className={btnPrimary}>Crear borrador</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">{documentos.map((item) => <button key={item.id} type="button" onClick={() => openDocumento(item.id)} className={btnGhost}>{item.formato_id} · {formatoById(item.formato_id).title} · v{item.version}</button>)}</div>
        </section>
        {documento && definition && <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft mb-2 text-xl">{definition.title}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{definition.source} · Borrador v{documento.version}</p>
          <FormatoEditor definition={definition} values={{ ...values, folio: selected.folio }} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} />
          {missing.length > 0 && <p className="mt-5 text-sm text-muted-foreground">Para emitir faltan: {missing.join(", ")}.</p>}
          {budgetTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Resumen calculado</h3><p>Subtotal cotizado: {budgetTotals.subtotalCotizado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p><p>Autorizado: {budgetTotals.autorizadoMenosPagado === null ? "Sin partidas autorizadas" : `${budgetTotals.importeAutorizado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${String(values.moneda)}`}</p><p>Estimación con reserva: {budgetTotals.estimacionConReserva.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p><p>Pagado: {budgetTotals.totalPagado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p></div>}
          {netTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Neto estimado</h3><p>Precio usado: {netTotals.precioBase.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p><p>Erogaciones: {netTotals.erogaciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p><p className="font-semibold">Neto: {netTotals.netoEstimado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p></div>}
          {hasUnsavedChanges && <p className="mt-5 text-sm text-muted-foreground">Guarda los cambios antes de emitir el PDF.</p>}
          {!definition.readyForEmission && <p className="mt-5 text-sm text-muted-foreground">Este formato está pendiente de cotejo con el original; la emisión permanece bloqueada.</p>}
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={saveDocumento} disabled={busy} className={btnPrimary}>Guardar borrador</button><button type="button" onClick={emitDocumento} disabled={busy || hasUnsavedChanges || missing.length > 0 || !definition.readyForEmission} className={btnGhost}>Emitir PDF de los datos guardados</button></div>
          {emisiones.length > 0 && <div className="mt-6 border-t border-border pt-4"><h3 className="font-semibold">Emisiones archivadas</h3><ul className="mt-2 space-y-5">{emisiones.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><a className="text-primary underline" href={`/api/admin/emisiones/${item.id}/descargar`}>PDF emitido · versión {item.draft_version} · {new Date(item.created_at).toLocaleString("es-MX")}</a><form onSubmit={(event) => uploadSignedCopy(item.id, event)} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">Adjuntar copia firmada externamente<input name="archivo" type="file" accept="application/pdf,.pdf" required className={inputClass} /></label><button type="submit" disabled={busy} className={btnGhost}>Archivar copia</button></form>{(copias[item.id] ?? []).map((copy) => <a key={copy.id} className="mt-2 block text-sm text-primary underline" href={`/api/admin/copias-firmadas/${copy.id}/descargar`}>Copia firmada adjunta · {new Date(copy.created_at).toLocaleString("es-MX")}</a>)}</li>)}</ul></div>}
        </section>}
      </>}</div>
    </section>
  </div>;
}

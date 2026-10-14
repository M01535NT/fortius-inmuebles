"use client";

import * as React from "react";
import Image from "next/image";
import { Field, btnGhost, btnPrimary, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, errorMessage, uid, useCollection, useLoadState } from "@/lib/admin/store";
import { calculateCommercial, commercialCalendarDate, commercialRows, COMPARABLE_COLUMNS, isCommercialPhotoUrl, parseComparablesCsv, publicPropertyInput, type CommercialRow } from "@/lib/apps/commercial";
import type { AppEditorProps, AppInput } from "@/lib/apps/types";
import { taskExpedienteContext, taskSchema, type Task, type TaskExpediente } from "@/lib/tasks";

const panel = "min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5";
const grid = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3";
const txt = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
const options = (values: Record<string, string>) => Object.entries(values).map(([value, label]) => ({ value, label }));
const propertyTypes = options({ casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", "nave-industrial": "Nave industrial" });
const currencies = options({ MXN: "MXN", USD: "USD" });
const operations = options({ venta: "Venta", renta: "Renta" });
type FormField = { key: string; label: string; type?: "number" | "date" | "textarea" | "checkbox"; options?: { value: string; label: string }[]; hint?: string };
const comparableFields: FormField[] = [
  { key: "label", label: "Referencia" }, { key: "type", label: "Tipo de inmueble", options: propertyTypes }, { key: "operation", label: "Operación", options: operations },
  { key: "source", label: "Fuente / documento / URL" }, { key: "date", label: "Fecha de fuente", type: "date" }, { key: "currency", label: "Moneda", options: currencies },
  { key: "areaBasis", label: "Base de superficie", options: options({ construccion: "Construcción", terreno: "Terreno" }) }, { key: "area", label: "Superficie m²", type: "number" }, { key: "price", label: "Precio", type: "number", hint: "Para renta, captura el importe mensual." },
  { key: "evidence", label: "Naturaleza del precio", options: options({ oferta: "Oferta publicada", cierre: "Cierre documentado" }) }, { key: "adjustmentPct", label: "Ajuste %", type: "number", hint: "Se aplica al precio por m²; usa 0 si no corresponde." }, { key: "adjustmentReason", label: "Sustento del ajuste", type: "textarea" },
];
const offerFields: FormField[] = [{ key: "name", label: "Referencia de oferta" }, { key: "currency", label: "Moneda", options: currencies }, { key: "price", label: "Precio ofertado", type: "number" }, { key: "deposit", label: "Anticipo", type: "number", hint: "Es parte del precio, no un ingreso adicional." }, { key: "expenses", label: "Gastos pendientes incluidos impuestos", type: "number", hint: "Vacío = desconocido. Captura 0 sólo si lo has confirmado." }, { key: "creditBalance", label: "Saldo de crédito", type: "number" }, { key: "days", label: "Plazo en días", type: "number" }, { key: "financing", label: "Financiamiento" }, { key: "paymentSchedule", label: "Calendario de pagos", type: "textarea" }, { key: "conditions", label: "Condiciones y contingencias", type: "textarea" }];
const quoteFields: FormField[] = [{ key: "concept", label: "Concepto" }, { key: "category", label: "Categoría", options: options({ servicios: "Servicios", honorarios: "Honorarios", gastos: "Gastos" }) }, { key: "quantity", label: "Cantidad", type: "number" }, { key: "unitPrice", label: "Precio unitario", type: "number", hint: "Máximo dos decimales; sin fracciones de centavo." }, { key: "discountPct", label: "Descuento %", type: "number" }, { key: "taxPct", label: "Impuesto %", type: "number", hint: "Captura la tasa aplicable; no se presume un impuesto." }];
const activityFields: FormField[] = [{ key: "date", label: "Fecha", type: "date" }, { key: "kind", label: "Tipo de actividad", options: options({ actividad: "Actividad", visita: "Visita realizada", oferta: "Oferta recibida" }) }, { key: "detail", label: "Descripción de actividad", type: "textarea" }];
const reviewFields: FormField[] = [{ key: "name", label: "Requisito" }, { key: "required", label: "Requerido para este caso", type: "checkbox" }, { key: "fileRef", label: "Archivo / versión / referencia", hint: "Registra el nombre y versión del soporte; no se carga ni certifica el archivo." }, { key: "reviewed", label: "Revisado por una persona", type: "checkbox" }, { key: "expires", label: "Vencimiento", type: "date" }, { key: "finding", label: "Hallazgo pendiente", type: "textarea" }];
function ValueField({ field, value, onChange, id, suffix = "" }: { field: FormField; value: unknown; onChange: (value: unknown) => void; id: string; suffix?: string }) {
  const label = field.label + suffix;
  if (field.type === "checkbox") return <label className="flex min-h-11 items-center gap-3 text-sm"><input id={id} className="h-4 w-4 accent-primary" type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />{label}</label>;
  return <Field label={label} htmlFor={id} hint={field.hint} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
    {field.options ? <select id={id} className={selectClass} value={txt(value)} onChange={event => onChange(event.target.value)}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      : field.type === "textarea" ? <textarea id={id} rows={3} maxLength={10000} className={textareaClass} value={txt(value)} onChange={event => onChange(event.target.value)} />
        : <input id={id} className={inputClass} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} maxLength={1000} value={txt(value)} onChange={event => onChange(event.target.value)} />}
  </Field>;
}
function RowsEditor({ title, rows, fields, onChange, blank, id }: { title: string; rows: CommercialRow[]; fields: FormField[]; onChange: (rows: CommercialRow[]) => void; blank: CommercialRow; id: string }) {
  return <section className="space-y-4" aria-label={title}><h2 className="text-lg font-semibold">{title}</h2>
    {!rows.length && <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Añade una fila para comenzar. Se conservará cada dato capturado.</p>}
    {rows.map((row, index) => <fieldset key={index} className={panel}><legend className="px-1 text-sm font-semibold">{title} · {index + 1}</legend><div className={grid}>{fields.map(field => <ValueField key={field.key} id={`${id}-${index}-${field.key}`} field={field} value={row[field.key]} suffix={` ${index + 1}`} onChange={value => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, [field.key]: value, ...(row.origin === "registrado" ? { origin: "manual" } : {}) } : item))} />)}</div>
      {!!row.origin && <p className="text-sm text-muted-foreground">Origen: {txt(row.origin)}{row.origin === "registrado" ? ". Si editas el contenido, se identificará como captura manual." : ""}</p>}
      <button type="button" className={btnGhost} aria-label={`Quitar ${title.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Quitar fila</button>
    </fieldset>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 200} onClick={() => onChange([...rows, { ...blank }])}>Añadir {title.toLowerCase()}</button>
  </section>;
}
export function CommercialEditor(props: AppEditorProps) {
  const { slug, input, onChange, onResult, context } = props;
  const id = React.useId(); const inventoryNeeded = slug === "ficha-comercial" || slug === "comparables";
  const properties = useCollection(db.propiedades, inventoryNeeded).filter(property => !property.demo);
  const inventoryState = useLoadState(db.propiedades);
  const [error, setError] = React.useState(""); const [busy, setBusy] = React.useState(false); const busyRef = React.useRef(false);
  const [task, setTask] = React.useState<Task | null>(null); const [confirmedTask, setConfirmedTask] = React.useState(false);
  const latest = React.useRef(props); React.useEffect(() => { latest.current = props; }, [props]);
  const selected = properties.find(property => property.slug === txt(input.propertySlug || context.inmuebleId));
  const csv = React.useMemo(() => parseComparablesCsv(txt(input.csvDraft)), [input.csvDraft]);
  let rows: CommercialRow[] = [], candidates: CommercialRow[] = [], items: CommercialRow[] = [];
  let collectionError = "";
  try { rows = commercialRows(input); candidates = commercialRows(input, "activityCandidates"); items = commercialRows(input, "items"); }
  catch (cause) { collectionError = errorMessage(cause); }
  const selection = Array.isArray(input.selectedActivityIds) ? input.selectedActivityIds.map(txt) : [];
  const patch = (changes: AppInput) => { setError(""); onChange({ ...input, ...changes }); };
  const patchLatest = (changes: AppInput) => latest.current.onChange({ ...latest.current.input, ...changes });
  async function run(action: () => Promise<void>) {
    if (busyRef.current) return; busyRef.current = true; setBusy(true); setError("");
    try { await action(); } catch (cause) { setError(errorMessage(cause)); } finally { busyRef.current = false; setBusy(false); }
  }
  function field(field: FormField) { return <ValueField key={field.key} id={`${id}-${field.key}`} field={field} value={input[field.key]} onChange={value => patch({ [field.key]: value })} />; }
  function inventoryPicker() { return <section className={panel}><div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><Field label="Inmueble del inventario" htmlFor={`${id}-inventory`} hint="Selecciona un registro disponible y decide cuándo incorporar sus datos."><select id={`${id}-inventory`} className={selectClass} value={txt(input.propertySlug || context.inmuebleId)} onChange={event => patch({ propertySlug: event.target.value, ...(slug === "ficha-comercial" ? { photoUrls: [], publicConfirmed: false } : {}) })}><option value="">Selecciona un inmueble</option>{properties.map(property => <option key={property.slug} value={property.slug}>{property.codigo} · {property.titulo}</option>)}</select></Field>
    <button type="button" className={btnGhost} disabled={!selected} onClick={() => {
      if (!selected) return;
      if (slug === "ficha-comercial") { patch({ ...publicPropertyInput(selected), contact: input.contact || "" }); return; }
      if (selected.precio.modalidad !== "publico") { setError("El inmueble no tiene un precio publicado. Captura un comparable con precio y fuente verificables."); return; }
      if (rows.length >= 200) { setError("Se admiten hasta 200 comparables."); return; }
      patch({ rows: [...rows, { label: `${selected.codigo} · ${selected.titulo}`, type: selected.tipo, operation: selected.operacion, source: `Inventario Fortius · ${selected.codigo}`, date: selected.informacionPublica?.disponibilidadRevisadaEl || (selected.publicadaEl ? commercialCalendarDate(selected.publicadaEl) : ""), currency: selected.precio.moneda, price: selected.precio.monto, areaBasis: selected.ficha.construccionM2 ? "construccion" : "terreno", area: selected.ficha.construccionM2 || selected.ficha.terrenoM2 || "", evidence: "oferta", adjustmentPct: 0, adjustmentReason: "", sourcePropertySlug: selected.slug }] });
    }}>{slug === "ficha-comercial" ? "Usar datos publicables" : "Añadir comparable del inventario"}</button></div>
    {inventoryState.status === "loading" && <p role="status" className="text-sm text-muted-foreground">Consultando inventario…</p>}
    {inventoryState.error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{inventoryState.error}</p><button type="button" className={btnGhost} onClick={() => void run(() => db.propiedades.load())}>Reintentar inventario</button></div>}
    {inventoryState.loaded && !properties.length && <p className="text-sm text-muted-foreground">No hay inmuebles disponibles. Puedes realizar captura manual.</p>}
  </section>; }
  async function loadActivities() {
    const expedienteId = context.expedienteId; if (!expedienteId) throw new Error("Selecciona un expediente en el contexto de la herramienta.");
    const result = await apiRequest<{ actividad: { id: string; descripcion: string; created_at: string }[] }>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/actividad`);
    if (latest.current.context.expedienteId !== expedienteId) throw new Error("El contexto cambió. Consulta la actividad del expediente actual.");
    patchLatest({ activityCandidates: result.actividad.map(item => ({ sourceId: item.id, date: commercialCalendarDate(item.created_at), kind: "actividad", detail: item.descripcion, origin: "registrado", sourceExpedienteId: expedienteId })), selectedActivityIds: [] });
  }
  async function prepareTask() {
    const expedienteId = context.expedienteId; if (!expedienteId) throw new Error("Vincula un expediente antes de crear una tarea.");
    const result = calculateCommercial(slug, input);
    const pendingRows = result.sections?.[0]?.rows?.filter(row => /Faltante|Sin revisar|Vencido|Hallazgo pendiente/.test(row[4])) ?? [];
    if (!pendingRows.length) throw new Error("No hay pendientes capturados para convertir en tarea.");
    if (pendingRows.length > 100) throw new Error("La tarea admite hasta 100 pendientes. Divide la revisión antes de crearla.");
    const [capabilities, response] = await Promise.all([apiRequest<{ expedienteLinks: boolean }>("/api/admin/tareas/capacidades"), apiRequest<{ expedientes: TaskExpediente[] }>("/api/admin/expedientes")]);
    if (!capabilities.expedienteLinks) throw new Error("El vínculo de tareas con expedientes aún no está habilitado en el servicio.");
    const expediente = response.expedientes.find(item => item.id === expedienteId && !item.deleted_at);
    if (!expediente || latest.current.context.expedienteId !== expedienteId) throw new Error("El expediente cambió o no está disponible.");
    const draft: Task = { id: txt(input.pendingTaskId) || uid(), titulo: `Revisar pendientes · ${expediente.folio}`.slice(0, 160), descripcion: `Revisión documental, lista ${txt(input.checklistVersion)}, fecha ${txt(input.asOf)}.\n` + pendingRows.map(row => `${row[0]}: ${row[4]}. ${row[5]}`).join("\n"), categoria: "documentacion", estado: "pendiente", prioridad: "normal", ...taskExpedienteContext(expediente), pasos: pendingRows.map(row => ({ id: uid(), texto: `${row[0]}: ${row[4]}`.slice(0, 500), hecho: false })) };
    setTask(draft); setConfirmedTask(false); patchLatest({ pendingTaskId: draft.id });
  }
  async function createTask() {
    if (!task || !confirmedTask || task.expedienteId !== context.expedienteId) throw new Error("Confirma la tarea y comprueba el expediente actual.");
    const result = await db.tareas.put(taskSchema.parse(task), null);
    patchLatest({ createdTaskId: result.id, createdTaskExpedienteId: task.expedienteId }); setTask(null); setConfirmedTask(false);
  }
  if (collectionError) return <section className={panel}><p role="alert" className="text-sm text-destructive">{collectionError}</p><p className="text-sm text-muted-foreground">No se modificó la captura. Abre una versión válida desde Mis trabajos o comienza un trabajo nuevo para continuar.</p></section>;
  return <form className="min-w-0 space-y-6" onSubmit={event => { event.preventDefault(); setError(""); try { onResult(calculateCommercial(slug, input)); } catch (cause) { setError(errorMessage(cause)); } }}>
    <fieldset disabled={busy} className="min-w-0 space-y-6">
      {inventoryNeeded && inventoryPicker()}
      {slug === "ficha-comercial" && <>
        <section className={panel}><h2 className="text-lg font-semibold">Datos comerciales</h2><div className={grid}>{[
          { key: "title", label: "Título comercial" }, { key: "location", label: "Ubicación publicable", hint: "Usa la referencia autorizada; evita datos privados de acceso." }, { key: "propertyType", label: "Tipo de inmueble", options: propertyTypes }, { key: "operation", label: "Operación", options: operations }, { key: "priceMode", label: "Precio visible", options: options({ consulta: "Consultar", publico: "Importe público" }) }, { key: "price", label: "Precio", type: "number", hint: "Para renta, captura el importe mensual." }, { key: "currency", label: "Moneda", options: currencies }, { key: "terrain", label: "Terreno m²", type: "number" }, { key: "construction", label: "Construcción m²", type: "number" }, { key: "areaSource", label: "Fuente de superficies" }, { key: "bedrooms", label: "Recámaras", type: "number" }, { key: "bathrooms", label: "Baños", type: "number" }, { key: "parking", label: "Estacionamientos", type: "number" }, { key: "contact", label: "Contacto comercial" }, { key: "description", label: "Descripción comercial", type: "textarea" }, { key: "amenities", label: "Amenidades", type: "textarea" },
        ].map(item => field(item as FormField))}</div></section>
        <section className={panel}><h2 className="text-lg font-semibold">Fotografías autorizadas</h2><p className="text-sm text-muted-foreground">Selecciona fotografías de la galería de un inmueble publicado. La ficha conserva la selección para su exportación.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selected?.publicada === true && !selected.demo && selected.galeria.filter(photo => isCommercialPhotoUrl(photo.src)).slice(0, 20).map((photo, index) => <label key={`${photo.src}-${index}`} className="flex min-h-11 items-start gap-3 rounded-md border border-border p-3"><input className="mt-1 h-4 w-4 shrink-0" type="checkbox" checked={Array.isArray(input.photoUrls) && input.photoUrls.includes(photo.src)} onChange={event => { const current = Array.isArray(input.photoUrls) ? input.photoUrls.filter(url => typeof url === "string" && selected.galeria.some(p => p.src === url)) : []; patch({ photoUrls: event.target.checked ? [...new Set([...current, photo.src])] : current.filter(url => url !== photo.src) }); }} /><span className="min-w-0 flex-1 space-y-2 break-words text-sm"><Image src={photo.src} alt={photo.alt || `Fotografía ${index + 1}`} width={480} height={320} unoptimized className="aspect-[3/2] w-full rounded-md object-cover" />{photo.alt || `Fotografía ${index + 1}`}</span></label>)}</div>{(!selected || selected.publicada !== true || !selected.galeria.length) && <p className="text-sm text-muted-foreground">Sin galería pública disponible para este inmueble.</p>}
          {field({ key: "publicConfirmed", label: "Confirmo que estos datos y fotografías están autorizados para uso comercial", type: "checkbox" })}
        </section>
      </>}
      {slug === "comparables" && <>
        <details className={panel}><summary className="flex min-h-11 cursor-pointer items-center font-semibold">Importar comparables desde CSV</summary><p className="text-sm text-muted-foreground">Hasta 200 filas. Separador coma y punto decimal; encierra textos con comas entre comillas. Revisa todas las filas antes de incorporarlas.</p><div className="overflow-x-auto rounded-md bg-secondary p-3 text-xs"><code>{COMPARABLE_COLUMNS.join(",")}</code></div>
          <Field label="Archivo CSV" htmlFor={`${id}-csv-file`}><input id={`${id}-csv-file`} className={inputClass + " py-2"} type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0]; if (!file) return; void run(async () => { if (file.size > 1_000_000) throw new Error("El archivo excede 1 MB."); patchLatest({ csvDraft: await file.text() }); }); }} /></Field>
          {field({ key: "csvDraft", label: "Contenido CSV", type: "textarea" })}
          {txt(input.csvDraft) && <div className="space-y-3">{csv.errors.map((message, index) => <p key={index} role="alert" className="text-sm text-destructive">{message}</p>)}<p className="text-sm">Vista previa: {csv.rows.length} filas válidas, {csv.errors.length} errores.</p>{csv.rows.length > 0 && <div className="max-h-72 overflow-auto rounded-md border border-border" role="region" aria-label="Vista previa de CSV" tabIndex={0}><table className="w-full min-w-[640px] text-left text-sm"><thead><tr>{["Referencia", "Fuente", "Fecha", "Precio", "Moneda", "Superficie", "Tipo de precio"].map(name => <th key={name} className="bg-secondary p-3">{name}</th>)}</tr></thead><tbody>{csv.rows.map((row, index) => <tr key={index}>{[row.label, row.source, row.date, row.price, row.currency, row.area, row.evidence].map((value, cell) => <td key={cell} className="border-t border-border p-3">{txt(value)}</td>)}</tr>)}</tbody></table></div>}</div>}
          <button type="button" className={btnGhost} disabled={!csv.rows.length || !!csv.errors.length || csv.rows.length + rows.length > 200} onClick={() => patch({ rows: [...rows, ...csv.rows], csvDraft: "" })}>Incorporar comparables ({csv.rows.length})</button>
        </details>
        <RowsEditor title="Comparables" id={id} rows={rows} fields={comparableFields} onChange={value => patch({ rows: value })} blank={{ label: "", type: "casa", operation: "venta", source: "", date: "", currency: "MXN", areaBasis: "construccion", area: "", price: "", evidence: "oferta", adjustmentPct: 0, adjustmentReason: "" }} />
        {field({ key: "analysis", label: "Interpretación del asesor", type: "textarea", hint: "Explica selección, soporte de ajustes, limitaciones y conclusión. Las muestras se separan por moneda, operación, tipo, superficie y oferta/cierre." })}
      </>}
      {slug === "ofertas" && <><RowsEditor title="Ofertas" id={id} rows={rows} fields={offerFields} onChange={value => patch({ rows: value })} blank={{ name: "", currency: "MXN", price: "", deposit: "", expenses: "", creditBalance: "", days: "", financing: "", paymentSchedule: "", conditions: "" }} />{field({ key: "recommendation", label: "Recomendación del asesor", type: "textarea", hint: "Explica los criterios. No se selecciona una oferta ganadora automáticamente." })}</>}
      {slug === "cotizador" && <><section className={panel}><div className={grid}>{[{ key: "client", label: "Cliente / destinatario" }, { key: "currency", label: "Moneda", options: currencies }, { key: "issuedAt", label: "Fecha de emisión", type: "date" }, { key: "validUntil", label: "Vigencia hasta", type: "date" }].map(item => field(item as FormField))}</div><p className="text-sm text-muted-foreground">Descuentos sobre el subtotal de cada partida; impuestos sobre el importe descontado. Cotización informativa, sin CFDI ni contratación automática.</p></section><RowsEditor title="Partidas" id={id} rows={items} fields={quoteFields} onChange={value => patch({ items: value })} blank={{ concept: "", category: "servicios", quantity: 1, unitPrice: "", discountPct: 0, taxPct: "" }} />{field({ key: "terms", label: "Condiciones y alcance del servicio", type: "textarea" })}</>}
      {slug === "informe-propietario" && <>
        <section className={panel}><div className={grid}>{[{ key: "ownerLabel", label: "Destinatario" }, { key: "from", label: "Inicio del periodo", type: "date" }, { key: "to", label: "Fin del periodo", type: "date" }].map(item => field(item as FormField))}</div></section>
        <section className={panel}><h2 className="text-lg font-semibold">Actividad del expediente</h2><p className="text-sm text-muted-foreground">Consulta hasta las 100 entradas más recientes. Selecciona sólo información pertinente para el propietario. Una entrada registrada no se cuenta automáticamente como visita u oferta.</p><button type="button" className={btnGhost} disabled={!context.expedienteId} onClick={() => void run(loadActivities)}>Consultar actividad del expediente</button>{!context.expedienteId && <p className="text-sm text-muted-foreground">Selecciona un expediente en el contexto para consultar su actividad.</p>}
          {candidates.filter(row => row.sourceExpedienteId === context.expedienteId).map((row, index) => <label key={txt(row.sourceId)} className="flex min-h-11 items-start gap-3 rounded-md border border-border p-3"><input className="mt-1 h-4 w-4 shrink-0" type="checkbox" aria-label={`Incluir actividad ${index + 1}`} checked={selection.includes(txt(row.sourceId))} onChange={event => patch({ selectedActivityIds: event.target.checked ? [...selection, txt(row.sourceId)] : selection.filter(value => value !== row.sourceId) })} /><span className="min-w-0 break-words text-sm">{txt(row.date)} · {txt(row.detail)}</span></label>)}
          {!!candidates.length && <button type="button" className={btnGhost} disabled={!selection.length} onClick={() => { const additions = candidates.filter(row => row.sourceExpedienteId === context.expedienteId && selection.includes(txt(row.sourceId)) && !rows.some(existing => existing.sourceId === row.sourceId)); if (rows.length + additions.length > 200) { setError("El informe admite hasta 200 actividades."); return; } patch({ rows: [...rows, ...additions], selectedActivityIds: [] }); }}>Incorporar actividades seleccionadas</button>}
        </section>
        <RowsEditor title="Actividades" id={id} rows={rows} fields={activityFields} onChange={value => patch({ rows: value })} blank={{ date: "", kind: "actividad", detail: "", origin: "manual" }} />
        {field({ key: "conclusion", label: "Balance del periodo", type: "textarea" })}{field({ key: "nextSteps", label: "Próximos pasos", type: "textarea" })}
      </>}
      {slug === "revisor-expediente" && <>
        <section className={panel}><h2 className="text-lg font-semibold">Lista documental del caso</h2><p className="text-sm text-muted-foreground">Adapta requisitos y aplicabilidad a esta operación. Cada versión guardada conserva la lista; recibir un archivo no equivale a revisarlo ni certificarlo.</p><div className={grid}>{[{ key: "checklistVersion", label: "Versión de la lista" }, { key: "asOf", label: "Fecha de revisión", type: "date" }, { key: "reviewer", label: "Persona que revisa" }, { key: "operation", label: "Operación", options: operations }, { key: "propertyType", label: "Tipo de inmueble", options: propertyTypes }].map(item => field(item as FormField))}</div></section>
        <RowsEditor title="Requisitos" id={id} rows={rows} fields={reviewFields} onChange={value => { patch({ rows: value }); setTask(null); setConfirmedTask(false); }} blank={{ name: "", required: true, fileRef: "", reviewed: false, expires: "", finding: "" }} />
        <section className={panel}><h2 className="text-lg font-semibold">Seguimiento de pendientes</h2><p className="text-sm text-muted-foreground">Prepara una tarea con los faltantes, documentos sin revisar, vencimientos y hallazgos. Revisa el contenido antes de confirmar su creación.</p><button type="button" className={btnGhost} disabled={!context.expedienteId || !!input.createdTaskId} onClick={() => void run(prepareTask)}>Preparar tarea de pendientes</button>{!context.expedienteId && <p className="text-sm text-muted-foreground">Vincula un expediente en el contexto para crear una tarea.</p>}
          {task && task.expedienteId === context.expedienteId && <div className="space-y-3 rounded-md border border-border p-4"><p className="font-semibold">{task.titulo}</p><p className="whitespace-pre-wrap break-words text-sm">{task.descripcion}</p><p className="text-sm">Responsable: {task.asesorId} · Expediente: {task.expedienteId}</p><label className="flex min-h-11 items-center gap-3 text-sm"><input className="h-4 w-4" type="checkbox" checked={confirmedTask} onChange={event => setConfirmedTask(event.target.checked)} />Confirmo crear esta tarea en el expediente</label><button type="button" className={btnPrimary} disabled={!confirmedTask} onClick={() => void run(createTask)}>Crear tarea en el expediente</button></div>}
          {!!input.createdTaskId && <p role="status" className="text-sm text-primary-ink">Tarea creada en el expediente.</p>}
        </section>
      </>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3"><button type="submit" className={btnPrimary}>Generar vista previa</button>{busy && <span role="status" className="text-sm text-muted-foreground">Procesando…</span>}<p className="text-sm text-muted-foreground">Revisa el resultado antes de guardar o exportar.</p></div>
    </fieldset>
  </form>;
}

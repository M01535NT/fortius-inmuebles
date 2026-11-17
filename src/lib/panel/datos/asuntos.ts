import { formatPrecio, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { EXPEDIENTE_DOCUMENTOS, EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import { calcularIntermediacion } from "@/lib/formatos/intermediacion";
import { calcularIntermediacionRenta } from "@/lib/formatos/intermediacion-renta";
import { DISCARD_REASONS, emptyWorkflow, WORKFLOW_STAGES, type OperationClose, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { PASO_CLAVES, type Tramite } from "@/lib/tramites";
import { normalizar } from "@/lib/panel/buscar";
import { TIPOS_ASUNTO } from "@/lib/panel/datos/asuntos-tipos";
import { diaLargo } from "@/lib/panel/calendario";
import type { SeccionFicha } from "@/lib/panel/datos/vistas";
import { isTaskOpen, taskExpedienteContext, type Task } from "@/lib/tasks";

/**
 * Asuntos en solo lectura (PN-04, primer corte): se leen de los expedientes que ya existen, con sus tareas,
 * personas e inmuebles. El título, el tipo libre y el estado propio llegan con las columnas de PN-02;
 * mientras, se derivan de lo que hay sin inventar datos. Funciones puras.
 */

/** Lo que el servidor manda de cada expediente (`GET /api/admin/expedientes`). */
export type Expediente = {
  id: string; cliente_id: string | null; asesor_id: string | null; propiedad_slug: string | null; folio: string | null;
  operacion: keyof typeof EXPEDIENTE_OPERACIONES; etapa: WorkflowStage; fecha_objetivo: string | null;
  flujo: OperationWorkflow | null; checklist: Partial<Record<DocumentoAsunto, EstadoDocumento>> | null; version: number;
  created_at: string; updated_at: string;
  /** Título libre (PN-02). Mientras el servidor no lo mande, se deriva del tipo, el inmueble y la persona. */
  titulo?: string | null;
  /** Tipo de asunto (PN-02: venta, renta, búsqueda, trámite, inversión, revisión, otro). Sin él, el tipo sale de la operación. */
  tipo_asunto?: string | null;
};

export type EstadoAsunto = "activo" | "espera" | "cerrado";
export const NOMBRE_ESTADO_ASUNTO: Record<EstadoAsunto, string> = { activo: "Activo", espera: "En espera", cerrado: "Cerrado" };

const RUTAS: Record<string, string> = { captacion: "Captación", compra: "Compra", arrendador: "Pone en renta", arrendatario: "Busca renta", inversion: "Inversión" };

export type FilaAsunto = {
  id: string; folio: string; titulo: string; tipo: string; estado: EstadoAsunto;
  linea: string; persona: Cliente | null; inmueble: Property | null;
  sigue: { id: string; texto: string; fecha: string | null; vencido: boolean } | null;
  abiertas: Task[]; movido: string; asesorId: string | null;
  /** Lo que queda para Fortius (comisión del cierre), en pesos; null si aún no hay dato. */
  paraFortius?: number | null;
};

export function estadoAsunto(e: Pick<Expediente, "etapa" | "flujo">): EstadoAsunto {
  if (e.etapa === "cerrado" || e.flujo?.estado === "descartada") return "cerrado";
  if (e.flujo?.estado === "pausada" || e.flujo?.estado === "regularizacion") return "espera";
  return "activo";
}

/** Lo que sigue: la tarea abierta con la fecha más próxima; sin fecha va después; si no hay, nada. */
export function loQueSigue(tareas: readonly Task[], hoy: string): FilaAsunto["sigue"] {
  const abiertas = tareas.filter(isTaskOpen);
  if (!abiertas.length) return null;
  const t = [...abiertas].sort((a, b) => (a.vence || "9999").localeCompare(b.vence || "9999"))[0];
  return { id: t.id, texto: t.titulo, fecha: t.vence || null, vencido: !!t.vence && t.vence < hoy };
}

export function filasAsuntos(
  expedientes: readonly Expediente[],
  d: { personas: readonly Cliente[]; inmuebles: readonly Property[]; tareas: readonly Task[]; hoy: string },
): FilaAsunto[] {
  const personas = new Map(d.personas.map((c) => [c.id, c]));
  const inmuebles = new Map(d.inmuebles.map((p) => [p.slug, p]));
  const porAsunto = new Map<string, Task[]>();
  for (const t of d.tareas) if (t.expedienteId) porAsunto.set(t.expedienteId, [...(porAsunto.get(t.expedienteId) ?? []), t]);
  return expedientes.map((e) => {
    const persona = (e.cliente_id && personas.get(e.cliente_id)) || null;
    const inmueble = (e.propiedad_slug && inmuebles.get(e.propiedad_slug)) || null;
    const tipo = (e.tipo_asunto && TIPOS_ASUNTO[e.tipo_asunto as keyof typeof TIPOS_ASUNTO]) || (EXPEDIENTE_OPERACIONES[e.operacion] ?? "Otro");
    const ruta = e.flujo?.ruta ? RUTAS[e.flujo.ruta] : undefined;
    const titulo = e.titulo?.trim() || [ruta && ruta !== tipo ? `${tipo}: ${ruta.toLowerCase()}` : tipo, inmueble?.titulo ?? persona?.nombre].filter(Boolean).join(" · ");
    const tareas = porAsunto.get(e.id) ?? [];
    return {
      id: e.id, folio: e.folio ?? "", titulo, tipo, estado: estadoAsunto(e),
      linea: [persona?.nombre, inmueble?.titulo, tipo].filter(Boolean).join(" · "),
      persona, inmueble, sigue: loQueSigue(tareas, d.hoy), abiertas: tareas.filter(isTaskOpen),
      movido: e.updated_at, asesorId: e.asesor_id, paraFortius: paraFortius(e),
    };
  });
}

export type OrdenAsuntos = "sigue" | "movidos" | "comision";
export function ordenarAsuntos(filas: readonly FilaAsunto[], orden: OrdenAsuntos): FilaAsunto[] {
  const copia = [...filas];
  if (orden === "movidos") return copia.sort((a, b) => b.movido.localeCompare(a.movido));
  if (orden === "comision") return copia.sort((a, b) => (b.paraFortius ?? -1) - (a.paraFortius ?? -1) || a.titulo.localeCompare(b.titulo, "es"));
  // Lo que sigue más pronto primero; los que no tienen fecha y luego los que no tienen siguiente paso, al final.
  const clave = (f: FilaAsunto) => (f.sigue ? f.sigue.fecha ?? "9998" : "9999");
  return copia.sort((a, b) => clave(a).localeCompare(clave(b)) || a.titulo.localeCompare(b.titulo, "es"));
}

export function filtrarAsuntos(filas: readonly FilaAsunto[], consulta: string, estado: EstadoAsunto, sinSiguiente = false): FilaAsunto[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return filas.filter((f) => f.estado === estado && (!sinSiguiente || !f.sigue)
    && palabras.every((p) => normalizar(`${f.titulo} ${f.linea} ${f.folio} ${f.persona?.telefono ?? ""}`).includes(p)));
}

export function textoSigue(s: FilaAsunto["sigue"]): string {
  if (!s) return "Sin siguiente paso";
  return s.fecha ? `${s.texto} · ${s.vencido ? "venció el" : ""} ${diaLargo(s.fecha)}`.replace(" ·  ", " · ") : s.texto;
}

/** La comisión que se anotó al registrar el cierre (la misma que usa Dinero), en pesos. */
function comisionTexto(e: Expediente): string | null {
  const c = e.flujo?.cierre?.comisionEstimada;
  return typeof c === "number" && c > 0 ? `$${c.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN` : null;
}

export function fichaAsunto(f: FilaAsunto, e: Expediente): SeccionFicha[] {
  const comision = comisionTexto(e);
  return [
    { titulo: "Resumen", datos: [
      { etiqueta: "Folio", valor: f.folio || "Sin folio", falta: !f.folio },
      { etiqueta: "Tipo", valor: f.tipo },
      { etiqueta: "Estado", valor: NOMBRE_ESTADO_ASUNTO[f.estado] },
    ] },
    { titulo: "Dinero", datos: [
      { etiqueta: "Precio del inmueble", valor: f.inmueble?.precio ? formatPrecio(f.inmueble.precio) : "Sin inmueble", falta: !f.inmueble },
      { etiqueta: "Comisión estimada", valor: comision ?? "Sale del contrato de intermediación", falta: !comision },
    ] },
    { titulo: "Con quién y qué", datos: [
      { etiqueta: "Persona", valor: f.persona?.nombre ?? "Sin persona", falta: !f.persona },
      { etiqueta: "Inmueble", valor: f.inmueble ? `${f.inmueble.titulo} · ${f.inmueble.codigo}` : "Sin inmueble", falta: !f.inmueble },
    ] },
  ];
}

/* ---------- Cambios del asunto (con las rutas que ya existen; el servidor aplica sus frenos) ---------- */

export type DocumentoAsunto = keyof typeof EXPEDIENTE_DOCUMENTOS;
export type EstadoDocumento = "pendiente" | "recibido" | "no_aplica";
export const MOTIVOS_NO_SE_DIO = DISCARD_REASONS;

/** Lo que manda `PUT /api/admin/expedientes/{id}/operacion`. */
export type CambioOperacion = {
  version: number; etapa: WorkflowStage; fechaObjetivo: string | null;
  checklist: Partial<Record<DocumentoAsunto, EstadoDocumento>>; flujo?: OperationWorkflow;
  /** Inmueble principal del asunto; solo se manda cuando cambia (null lo quita). */
  propiedadSlug?: string | null;
};

const RUTA_POR_OPERACION: Record<string, OperationWorkflow["ruta"]> = { venta: "captacion", renta: "arrendador", inversion: "inversion" };

function base(e: Expediente): CambioOperacion {
  return { version: e.version, etapa: e.etapa, fechaObjetivo: e.fecha_objetivo ? e.fecha_objetivo.slice(0, 10) : null, checklist: { ...(e.checklist ?? {}) } };
}
const flujoDe = (e: Expediente): OperationWorkflow => e.flujo ?? emptyWorkflow(RUTA_POR_OPERACION[e.operacion] ?? "captacion");

/** Poner en espera: se anota qué espera en el motivo. Reanudar lo vuelve activo y limpia el motivo. */
export function ponerEnEspera(e: Expediente, queEspera: string): CambioOperacion {
  return { ...base(e), flujo: { ...flujoDe(e), estado: "pausada", motivo: queEspera.trim().slice(0, 1000) } };
}
export function reanudar(e: Expediente): CambioOperacion {
  return { ...base(e), flujo: { ...flujoDe(e), estado: "activa", motivo: "" } };
}
/** «No se dio»: el motivo sale de la lista fija del servidor (COR-14); el detalle va después de «:». */
export function noSeDio(e: Expediente, motivo: (typeof DISCARD_REASONS)[number], detalle = ""): CambioOperacion {
  const d = detalle.trim();
  return { ...base(e), flujo: { ...flujoDe(e), estado: "descartada", motivo: (d ? `${motivo}: ${d}` : motivo).slice(0, 1000) } };
}
export function marcarDocumento(e: Expediente, clave: DocumentoAsunto, estado: EstadoDocumento): CambioOperacion {
  return { ...base(e), checklist: { ...(e.checklist ?? {}), [clave]: estado } };
}

/** Liga (o quita, con null) el inmueble principal del asunto. Es el respaldo de antes de la tabla de inmuebles de PN-02. */
export function ponerInmueblePrincipal(e: Expediente, slug: string | null): CambioOperacion {
  return { ...base(e), propiedadSlug: slug };
}

/**
 * Lo que decide el estado del asunto en la base vieja (etapa y estado del flujo). Si cambia, hay que copiar el estado
 * a las columnas de PN-02 (`estado_asunto`, `resultado`).
 */
export const huellaDeEstado = (e: Pick<Expediente, "etapa" | "flujo">) => `${e.etapa}|${e.flujo?.estado ?? ""}`;

/** Cambia la fecha objetivo (fecha clave del asunto, que llega a Hoy y a la Agenda). */
export function cambiarFechaObjetivo(e: Expediente, fecha: string | null): CambioOperacion {
  return { ...base(e), fechaObjetivo: fecha };
}

/**
 * Cierre del asunto (COR-22, RP-99): quién captó y quién vendió, y la comisión estimada que sale del contrato de
 * intermediación (09 en venta, 21 en renta), igual que en el panel viejo. Con esto Dinero sabe qué se cobra.
 * Solo aplica del lado del propietario (captación y arrendador).
 */
export function llevaCierre(e: Pick<Expediente, "operacion" | "flujo">): boolean {
  const ruta = e.flujo?.ruta ?? RUTA_POR_OPERACION[e.operacion];
  return ruta === "captacion" || ruta === "arrendador";
}
export const esRenta = (e: Pick<Expediente, "operacion" | "flujo">) => e.operacion === "renta" || e.flujo?.ruta === "arrendador";

export type DocConDatos = { formato_id: string; data?: unknown; version?: number };
/** La comisión sin IVA del contrato de intermediación más reciente (la lista llega del más nuevo al más viejo). */
export function comisionDelContrato(docs: readonly DocConDatos[], renta: boolean): { comision: number; fuente: string } | null {
  const d = docs.find((x) => x.formato_id === (renta ? "21" : "09"));
  if (!d || !d.data || typeof d.data !== "object") return null;
  const datos = d.data as Record<string, unknown>;
  const c = renta ? calcularIntermediacionRenta(datos).honorarios : calcularIntermediacion(datos).comision;
  if (typeof c !== "number" || !(c >= 0)) return null;
  return { comision: c, fuente: `Contrato de intermediación · versión ${d.version ?? 1}` };
}
/** Quién captó (por omisión, el asesor de antes si se reasignó) y quién vendió (por omisión, quien lo lleva). */
export function cierrePropuesto(e: Expediente): { capto: string; vendio: string } {
  return { capto: e.flujo?.cierre?.capto ?? e.flujo?.captadoPor ?? e.asesor_id ?? "", vendio: e.flujo?.cierre?.vendio ?? e.asesor_id ?? "" };
}
/** Guarda el cierre; sin `cierre` lo quita (para Deshacer el primer registro). */
export function conCierre(e: Expediente, cierre: OperationClose | undefined): CambioOperacion {
  const flujo = { ...flujoDe(e) };
  if (cierre) flujo.cierre = cierre; else delete flujo.cierre;
  return { ...base(e), flujo };
}
export function armarCierre(capto: string, vendio: string, contrato: { comision: number; fuente: string } | null): OperationClose {
  return { capto, vendio, ...(contrato ? { comisionEstimada: contrato.comision, fuente: contrato.fuente } : {}) };
}

export type DocumentoFila = { clave: DocumentoAsunto; nombre: string; estado: EstadoDocumento };
export function documentosDelAsunto(e: Pick<Expediente, "checklist">): DocumentoFila[] {
  return (Object.keys(EXPEDIENTE_DOCUMENTOS) as DocumentoAsunto[]).map((clave) => ({ clave, nombre: EXPEDIENTE_DOCUMENTOS[clave], estado: e.checklist?.[clave] ?? "pendiente" }));
}
export function cuentaDocumentos(docs: readonly DocumentoFila[]): string {
  const aplican = docs.filter((d) => d.estado !== "no_aplica");
  return `${aplican.filter((d) => d.estado === "recibido").length} de ${aplican.length} recibidos`;
}

/** Lo que espera o por qué no se dio, para mostrarlo arriba del asunto. */
export function motivoDelEstado(e: Pick<Expediente, "flujo">): string | null {
  const m = e.flujo?.motivo?.trim();
  if (!m) return null;
  if (e.flujo?.estado === "pausada" || e.flujo?.estado === "regularizacion") return `Espera: ${m}`;
  if (e.flujo?.estado === "descartada") return `No se dio: ${m}`;
  return null;
}

/** Notas e historial que manda `GET /api/admin/expedientes/{id}/actividad`. */
export type Actividad = { id: string; tipo: string; descripcion: string; created_by: string | null; created_at: string };

/**
 * «Lo que sigue» del asunto: una tarea ligada al asunto. La base exige que lleve la misma persona, asesor e inmueble del asunto,
 * así que se toman de él. Categoría según el tipo de asunto.
 */
export function nuevoSiguiente(e: Pick<Expediente, "id" | "cliente_id" | "asesor_id" | "propiedad_slug" | "operacion">, texto: string, vence: string | null, ahora = new Date(), id: string = crypto.randomUUID()): Task {
  const fecha = ahora.toISOString();
  const categoria: Task["categoria"] = e.operacion === "renta" ? "arrendamientos" : e.operacion === "administracion" ? "administracion" : "comercializacion";
  return {
    id, titulo: texto.trim().slice(0, 160), descripcion: "", categoria, estado: "pendiente", prioridad: "normal", pasos: [],
    ...taskExpedienteContext({ id: e.id, folio: "", cliente_id: e.cliente_id ?? "", asesor_id: e.asesor_id ?? "", propiedad_slug: e.propiedad_slug }),
    ...(vence ? { vence } : {}), creadoEl: fecha, actualizadoEl: fecha,
  };
}

/** Posponer: cambia la fecha (o la quita). */
export function posponer(t: Task, vence: string | null, ahora = new Date()): Task {
  const n: Task = { ...t, actualizadoEl: ahora.toISOString() };
  if (vence) n.vence = vence; else delete n.vence;
  return n;
}

/** Asuntos de una persona o de un inmueble, para su ficha: activos primero, luego en espera y cerrados; dentro, los movidos hace poco. */
export function asuntosDe(expedientes: readonly Expediente[], de: { clienteId?: string | null; slug?: string | null }): { id: string; texto: string; estado: EstadoAsunto }[] {
  const peso: Record<EstadoAsunto, number> = { activo: 0, espera: 1, cerrado: 2 };
  return expedientes
    .filter((e) => (de.clienteId ? e.cliente_id === de.clienteId : false) || (de.slug ? e.propiedad_slug === de.slug : false))
    .map((e) => ({ e, estado: estadoAsunto(e) }))
    .sort((a, b) => peso[a.estado] - peso[b.estado] || b.e.updated_at.localeCompare(a.e.updated_at))
    .map(({ e, estado }) => ({ id: e.id, texto: [EXPEDIENTE_OPERACIONES[e.operacion] ?? "Otro", e.folio].filter(Boolean).join(" · "), estado }));
}

/** Quién escribió una nota: «Tú», el nombre del asesor ligado a esa cuenta o, si no se sabe, nada. */
export function autorDeNota(
  creadoPor: string | null, yo: string | null,
  cuentas: readonly { user_id: string; asesor_id: string | null; email: string }[], asesores: readonly { id: string; nombre: string }[],
): string | null {
  if (!creadoPor) return null;
  if (yo && creadoPor === yo) return "Tú";
  const cuenta = cuentas.find((c) => c.user_id === creadoPor);
  if (!cuenta) return null;
  return asesores.find((a) => a.id === cuenta.asesor_id)?.nombre ?? cuenta.email.split("@")[0] ?? null;
}

export type AvisoAsunto = {
  clave: "documentos" | "fecha" | "inmueble" | "firma" | "identificacion" | "hipoteca" | "contraparte" | "cierre"
    | "checklist" | "entrevista" | "levantamiento" | "revision15" | "privacidad";
  texto: string; accion: string | null;
  /** Aviso legal (LFPIORPI, revisión del abogado, aviso de privacidad, hipoteca inscrita): se distingue en pantalla. */
  legal?: boolean;
  /** Documento de Fortius que lo resuelve: se crea o se abre desde el aviso. */
  documento?: { formato: string; id?: string };
};

/** Trámite de cancelación de hipoteca, con lo que hace falta para el aviso de la firma. */
export type TramiteDelAsunto = Pick<Tramite, "expedienteId" | "pasoActual" | "firmaSinCancelacion">;
const PASO_REGISTRO = PASO_CLAVES.indexOf("registro");
/** Igual que la base (fortius_inmuebles_tramites_que_frenan_firma): sin inscribir y sin decisión del director. Un cancelado cuenta. */
const hipotecaSinInscribir = (t: TramiteDelAsunto) => t.pasoActual <= PASO_REGISTRO && !t.firmaSinCancelacion;
const etapaAlMenos = (e: Pick<Expediente, "etapa">, etapa: WorkflowStage) => WORKFLOW_STAGES.indexOf(e.etapa) >= WORKFLOW_STAGES.indexOf(etapa);

/**
 * Avisos del asunto activo (boceto: una línea ámbar plegada). Nada frena (titular, 16/11/2026: «sin frenos de
 * protección»): lo que antes rechazaba la base al avanzar se avisa aquí. «identificacion» es un aviso legal (LFPIORPI).
 */
export function avisosDelAsunto(
  e: Pick<Expediente, "id" | "operacion" | "propiedad_slug" | "checklist" | "fecha_objetivo" | "flujo" | "etapa">, hoy: string,
  tramites: readonly TramiteDelAsunto[] = [],
): AvisoAsunto[] {
  if (estadoAsunto(e) !== "activo") return [];
  const avisos: AvisoAsunto[] = [];
  const faltan = documentosDelAsunto(e).filter((d) => d.estado === "pendiente").length;
  if (faltan) avisos.push({ clave: "documentos", texto: faltan === 1 ? "Falta 1 documento" : `Faltan ${faltan} documentos`, accion: "Ver documentos" });
  const fecha = e.fecha_objetivo?.slice(0, 10);
  if (fecha && fecha < hoy) avisos.push({ clave: "fecha", texto: `La fecha objetivo pasó el ${diaLargo(fecha)}`, accion: null });
  const ruta = e.flujo?.ruta ?? RUTA_POR_OPERACION[e.operacion];
  if (ruta !== "inversion" && !e.propiedad_slug) avisos.push({ clave: "inmueble", texto: "Sin inmueble ligado", accion: null });
  if (llevaCierre(e)) {
    const firma = e.flujo?.firmaContrato;
    if (!firma) avisos.push({ clave: "firma", texto: "Falta registrar la firma del contrato de intermediación", accion: null });
    else if (!firma.completa) avisos.push({ clave: "firma", texto: "La firma del contrato está incompleta: faltan firmantes", accion: null });
    else if (!firma.revisada) avisos.push({ clave: "firma", texto: "El director aún no revisa la firma del contrato", accion: null });
  }
  if (e.operacion === "venta" && (ruta === "captacion" || ruta === "compra") && e.flujo?.requisitos?.identificacion_pld?.estado !== "revisado")
    avisos.push({ clave: "identificacion", texto: "Antes de firmar, integra la identificación de las partes (ley contra el lavado de dinero, LFPIORPI)", accion: "Ver documentos", legal: true });
  if (e.operacion === "venta" && tramites.some((t) => t.expedienteId === e.id && hipotecaSinInscribir(t)))
    avisos.push({ clave: "hipoteca", texto: "Antes de firmar, la cancelación de hipoteca debe quedar inscrita en el Registro Público", accion: "Ver trámite", legal: true });
  if (ruta !== "inversion" && etapaAlMenos(e, "negociacion") && !e.flujo?.contraparteId && !e.flujo?.contraparteLeadId && (e.flujo?.contraparteExterna?.trim().length ?? 0) < 3)
    avisos.push({ clave: "contraparte", texto: "Falta identificar con quién se cierra (la contraparte)", accion: null });
  if (llevaCierre(e) && etapaAlMenos(e, "entrega") && !e.flujo?.cierre)
    avisos.push({ clave: "cierre", texto: "Falta anotar quién captó y quién vendió", accion: null });
  return avisos;
}

/* ---------- Tabla y ficha del boceto (escritorio B: tabla y panel; teléfono) ---------- */

/** Lo que queda para Fortius: la comisión que se anotó al cerrar (la misma que usa Dinero). */
export function paraFortius(e: Pick<Expediente, "flujo">): number | null {
  const c = e.flujo?.cierre?.comisionEstimada;
  return typeof c === "number" && c > 0 ? c : null;
}
export const pesosCortos = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

/** Papel de la persona principal según el lado del asunto (boceto: Vende, Compra, Pone en renta, Renta…). */
export function papelPrincipal(e: Pick<Expediente, "operacion" | "flujo">): string {
  const ruta = e.flujo?.ruta ?? RUTA_POR_OPERACION[e.operacion];
  return ruta === "captacion" ? "Vende" : ruta === "compra" ? "Compra" : ruta === "arrendador" ? "Pone en renta" : ruta === "arrendatario" ? "Renta" : ruta === "inversion" ? "Invierte" : "Cliente";
}

/** Cómo terminó: «Se logró» (llegó al cierre) o «No se dio» con su motivo; null si sigue abierto. */
export function comoTermino(e: Pick<Expediente, "etapa" | "flujo" | "updated_at">): { como: "Se logró" | "No se dio"; motivo: string; cuando: string } | null {
  const cuando = diaLargo(e.updated_at.slice(0, 10));
  if (e.flujo?.estado === "descartada") return { como: "No se dio", motivo: e.flujo.motivo?.trim() ?? "", cuando };
  if (e.etapa === "cerrado") return { como: "Se logró", motivo: "", cuando };
  return null;
}

/** «Lo que sigue» en la fila de la tabla o en la tarjeta, con su clase de color (boceto: punto azul, rojo, ámbar, aro o gris). */
export function sigueEnFila(f: FilaAsunto, e: Pick<Expediente, "etapa" | "flujo" | "updated_at"> | null): { texto: string; clase: "" | "late" | "none" | "wait" | "done" } {
  const fin = e ? comoTermino(e) : null;
  if (f.estado === "cerrado" && fin) return { texto: [fin.como, fin.cuando, fin.motivo].filter(Boolean).join(" · "), clase: "done" };
  if (f.estado === "espera") {
    const que = e?.flujo?.motivo?.trim();
    return { texto: que ? `En espera de ${que.charAt(0).toLowerCase()}${que.slice(1)}` : "En espera", clase: "wait" };
  }
  if (!f.sigue) return { texto: "Sin siguiente paso", clase: "none" };
  return { texto: textoSigue(f.sigue), clase: f.sigue.vencido ? "late" : "" };
}

/** Filtros del boceto: estado, búsqueda, «Solo con avisos», «Sin siguiente paso» y tipos. */
export function filtrarVista(filas: readonly FilaAsunto[], f: {
  consulta: string; estado: EstadoAsunto; sinSiguiente: boolean; conAvisos: boolean; tipos: readonly string[]; avisos: ReadonlyMap<string, number>;
}): FilaAsunto[] {
  return filtrarAsuntos(filas, f.consulta, f.estado, f.sinSiguiente)
    .filter((x) => (!f.conAvisos || (f.avisos.get(x.id) ?? 0) > 0) && (!f.tipos.length || f.tipos.includes(x.tipo)));
}

/** «Se logró» en un solo paso (DEC-63): cierra el asunto sin frenar. Sin el cambio del servidor publicado, este responde su motivo. */
export function seLogro(e: Expediente): CambioOperacion {
  return { ...base(e), etapa: "cerrado", flujo: { ...flujoDe(e), estado: "activa", motivo: "" } };
}
/** Reabrir: vuelve a activo; si había llegado al cierre, regresa a la última etapa abierta. */
export function reabrir(e: Expediente): CambioOperacion {
  const r = reanudar(e);
  return e.etapa === "cerrado" ? { ...r, etapa: "postventa" } : r;
}

/** Iniciales para el círculo de una persona («Mariana López» → «ML»). */
export function iniciales(nombre: string | null | undefined): string {
  return (nombre ?? "").replace(/^Lic\. /, "").trim().split(/\s+/).filter(Boolean).map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase() || "?";
}

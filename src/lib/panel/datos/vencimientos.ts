import { estadoAsunto, type Expediente, type FilaAsunto } from "@/lib/panel/datos/asuntos";
import type { VenceDia } from "@/lib/panel/datos/agenda-resultado";
import { dinero } from "@/lib/panel/datos/dinero";
import { faltaDe, NOMBRE_TIPO, porCobrarSueltos, type Movimiento } from "@/lib/panel/datos/movimientos";
import { rutaTramite } from "@/lib/panel/datos/hoy-pendientes";
import type { Tramite } from "@/lib/tramites";

/**
 * Vencimientos que llegan a Hoy y a la Agenda (DECISIONES: «Agenda», «Trámites», «Dinero» y la ficha del asunto, punto 7).
 * Tres fuentes, leídas con lo que ya existe:
 *  · las esperas de los trámites: el día en que toca volver a preguntar, con acceso al trámite;
 *  · los cobros de Dinero con vencimiento (comisiones y gastos por reembolsar pendientes; los apartados no vencen);
 *  · las fechas clave de los asuntos. Hoy el servidor guarda una sola, la fecha objetivo; firma, apartado y
 *    precalificación llegarán con sus propios campos (PN-02) y se suman aquí.
 * Los contratos (fin del encargo y licencia) ya tienen su lectura propia (`vencimientosEnDias`). Funciones puras.
 */

export type ClaseVence = "tramite" | "cobro" | "fecha" | "contrato";
export type Vencimiento = VenceDia & { clase: ClaseVence };

const RUTA_DINERO = "/admin/dinero";
const esFecha = (f: string | null | undefined): f is string => Boolean(f && /^\d{4}-\d{2}-\d{2}/.test(f));

/** Trámites en curso con espera: el día de volver a preguntar. */
export function vencenTramites(tramites: readonly Pick<Tramite, "id" | "titulo" | "estado" | "espera" | "expedienteId">[]): Vencimiento[] {
  return tramites
    .filter((t) => t.estado === "en_curso" && t.espera && esFecha(t.espera.volver))
    .map((t) => ({
      id: `r:${t.id}`, clase: "tramite" as const, fecha: (t.espera?.volver ?? "").slice(0, 10),
      titulo: `Volver a preguntar: ${t.titulo}`, detalle: `A ${t.espera?.quien ?? ""}`.trim(),
      href: rutaTramite(t.id), expedienteId: t.expedienteId || undefined,
    }));
}

/** Cobros pendientes con vencimiento, con lo que falta. `lineaAsunto` da el nombre del asunto si se conoce. */
export function vencenMovimientos(ms: readonly Movimiento[], lineaAsunto: (id: string) => string | undefined = () => undefined): Vencimiento[] {
  return porCobrarSueltos(ms)
    .filter((m) => esFecha(m.venceEl))
    .map((m) => {
      const concepto = m.concepto.trim();
      const titulo = m.tipo === "comision" ? `Cobrar la comisión${concepto ? `: ${concepto}` : ""}` : `${NOMBRE_TIPO[m.tipo]}${concepto ? `: ${concepto}` : ""}`;
      const falta = faltaDe(m);
      const monto = m.cobrado > 0 ? `faltan ${dinero(falta, m.moneda)} de ${dinero(m.monto, m.moneda)}` : dinero(falta, m.moneda);
      return {
        id: `m:${m.id}`, clase: "cobro" as const, fecha: (m.venceEl ?? "").slice(0, 10), titulo,
        detalle: [lineaAsunto(m.asuntoId), monto].filter(Boolean).join(" · "), href: RUTA_DINERO, expedienteId: m.asuntoId,
      };
    });
}

/** Fecha objetivo de los asuntos que siguen abiertos (activos o en espera). */
export function vencenAsuntos(expedientes: readonly Expediente[], filas: readonly FilaAsunto[] = []): Vencimiento[] {
  const porId = new Map(filas.map((f) => [f.id, f]));
  return expedientes
    .filter((e) => esFecha(e.fecha_objetivo) && estadoAsunto(e) !== "cerrado")
    .map((e) => {
      const f = porId.get(e.id);
      return {
        id: `a:${e.id}`, clase: "fecha" as const, fecha: (e.fecha_objetivo ?? "").slice(0, 10),
        titulo: `Fecha objetivo: ${f?.titulo || e.folio || "asunto"}`, detalle: f?.linea || "Fecha clave del asunto", expedienteId: e.id,
      };
    });
}

/** Lo de un periodo [desde, hasta] (fechas «AAAA-MM-DD», ambas incluidas), de lo más próximo a lo más lejano. */
export function entre(lista: readonly Vencimiento[], desde: string, hasta: string): Vencimiento[] {
  return lista.filter((v) => v.fecha >= desde && v.fecha <= hasta).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

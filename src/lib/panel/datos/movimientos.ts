import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import type { Moneda } from "@/lib/panel/datos/dinero";

/**
 * Movimientos de Dinero (PN-08, DEC-53 y DEC-56): comisiones sueltas, gastos por reembolsar y apartados en resguardo.
 * Rutas: `GET/POST /api/admin/movimientos`, `PATCH /api/admin/movimientos/{id}` y `GET /api/admin/movimientos/{id}/comprobante`.
 * El comprobante sube a la carga temporal privada (`POST /api/admin/files/upload` + `PUT`) y el servidor lo guarda en privado.
 * Mientras la migración no esté aplicada las rutas responden 503: la pantalla lo dice y sigue con lo demás.
 */

export type TipoMovimiento = "comision" | "gasto" | "apartado";
export type EstadoMovimiento = "pendiente" | "entregado" | "reembolsado" | "cobrado";
export type FormaPago = "transferencia" | "efectivo" | "cheque";
export type Movimiento = {
  id: string; tipo: TipoMovimiento; asuntoId: string; monto: number; moneda: Moneda; concepto: string;
  venceEl: string | null; cobrado: number; formaPago: FormaPago | null; estado: EstadoMovimiento; liquidadoEl: string | null;
  comprobante: { nombre: string; tipo: string } | null; responsableId: string; eliminado: boolean; version: number; creadoEl: string;
};

export const NOMBRE_TIPO: Record<TipoMovimiento, string> = { comision: "Comisión", gasto: "Gasto por reembolsar", apartado: "Apartado" };
export const FORMAS_PAGO: { valor: FormaPago; etiqueta: string }[] = [
  { valor: "transferencia", etiqueta: "Transferencia" }, { valor: "efectivo", etiqueta: "Efectivo" }, { valor: "cheque", etiqueta: "Cheque" },
];
export const TIPOS_COMPROBANTE = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];

const redondear = (n: number) => Math.round(n * 100) / 100;
export const faltaDe = (m: Pick<Movimiento, "monto" | "cobrado">) => Math.max(0, redondear(m.monto - m.cobrado));

/** Te deben: comisiones y gastos pendientes. Por entregar: apartados pendientes. Historial: lo ya cerrado. */
export const porCobrarSueltos = (ms: readonly Movimiento[]) => ms.filter((m) => !m.eliminado && m.tipo !== "apartado" && m.estado === "pendiente");
export const porEntregar = (ms: readonly Movimiento[]) => ms.filter((m) => !m.eliminado && m.tipo === "apartado" && m.estado === "pendiente");
export const cerrados = (ms: readonly Movimiento[]) => ms.filter((m) => !m.eliminado && m.estado !== "pendiente")
  .sort((a, b) => (b.liquidadoEl ?? "").localeCompare(a.liquidadoEl ?? ""));

export type Plazo = "vencido" | "semana" | "despues";
/** Boceto: Vencido, Esta semana (hasta 7 días) y Después (más adelante o sin fecha). */
export function plazoDe(vence: string | null, hoy: string): Plazo {
  if (!vence) return "despues";
  if (vence < hoy) return "vencido";
  const limite = new Date(`${hoy}T12:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() + 7);
  return vence <= limite.toISOString().slice(0, 10) ? "semana" : "despues";
}

export function sumaPor(ms: readonly Movimiento[], moneda: Moneda, cuanto: (m: Movimiento) => number): number {
  return redondear(ms.filter((m) => m.moneda === moneda).reduce((s, m) => s + cuanto(m), 0));
}

async function pedir<T>(url: string, metodo = "GET", cuerpo?: unknown, senal?: AbortSignal): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      method: metodo, credentials: "same-origin", cache: "no-store", signal: senal,
      ...(cuerpo === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) }),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión. Vuelve a intentarlo.", 0);
  }
  const datos = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) {
    throw new ErrorDeLectura(
      r.status === 401 ? "Tu sesión terminó. Vuelve a entrar." : r.status === 403 ? (datos.error || "No tienes permiso para esto.") : (datos.error || "No se pudo completar. Vuelve a intentarlo."),
      r.status,
    );
  }
  return datos;
}

/** El servidor todavía no tiene la tabla de movimientos (migración sin aplicar). */
export const sinMovimientosEnServidor = (e: unknown) => e instanceof ErrorDeLectura && e.estado === 503;

export async function leerMovimientos(senal?: AbortSignal): Promise<Movimiento[]> {
  return (await pedir<{ movimientos?: Movimiento[] }>("/api/admin/movimientos", "GET", undefined, senal)).movimientos ?? [];
}

/** Sube el comprobante a la carga temporal privada y devuelve el ticket que el servidor usa para guardarlo. */
export async function subirComprobante(f: File): Promise<string> {
  if (!TIPOS_COMPROBANTE.includes(f.type)) throw new ErrorDeLectura("El comprobante debe ser PDF o imagen (JPG, PNG, WEBP o GIF).", 400);
  const p = await pedir<{ signedUrl: string; ticket: string }>("/api/admin/files/upload", "POST", { name: f.name.slice(0, 160) || "Comprobante", size: f.size, contentType: f.type, visibility: "private" });
  let envio: Response;
  try { envio = await fetch(p.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": f.type }, body: f }); }
  catch { throw new ErrorDeLectura("Sin conexión: el comprobante no se subió.", 0); }
  if (!envio.ok) throw new ErrorDeLectura("No se pudo subir el comprobante. Vuelve a intentarlo.", envio.status);
  return p.ticket;
}

export type AltaMovimiento = {
  tipo: TipoMovimiento; asuntoId: string; monto: number; moneda: Moneda; concepto: string; vence: "0" | "7" | "30"; ticket?: string;
};
export async function crearMovimiento(alta: AltaMovimiento): Promise<Movimiento> {
  return (await pedir<{ movimiento: Movimiento }>("/api/admin/movimientos", "POST", alta)).movimiento;
}

export type CambioMovimiento =
  | { accion: "entregar"; version: number }
  | { accion: "cobrar"; version: number; monto: number; formaPago: FormaPago }
  | { accion: "reabrir"; version: number; cobrado?: number; formaPago?: FormaPago | null }
  | { accion: "quitar"; version: number }
  | { accion: "restaurar"; version: number }
  | { accion: "comprobante"; version: number; ticket: string };
export async function cambiarMovimiento(id: string, cambio: CambioMovimiento): Promise<Movimiento> {
  return (await pedir<{ movimiento: Movimiento }>(`/api/admin/movimientos/${encodeURIComponent(id)}`, "PATCH", cambio)).movimiento;
}

export async function abrirComprobante(id: string): Promise<string> {
  return (await pedir<{ url: string }>(`/api/admin/movimientos/${encodeURIComponent(id)}/comprobante`)).url;
}
